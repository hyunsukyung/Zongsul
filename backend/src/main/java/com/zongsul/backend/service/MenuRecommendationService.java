package com.zongsul.backend.service;

import com.zongsul.backend.domain.menu.MenuRecommendation;
import com.zongsul.backend.domain.menu.MenuRecommendationRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.*;


@Service
public class MenuRecommendationService {

    private final MenuRecommendationRepository repo;
    private final StatsService statsService;
    private final MenuDataProvider menuProvider;

    public MenuRecommendationService(MenuRecommendationRepository repo, StatsService statsService, MenuDataProvider menuProvider) {
        this.repo = repo;
        this.statsService = statsService;
        this.menuProvider = menuProvider;
    }

    @Scheduled(cron = "0 0 0 ? * SUN")
    public void generateWeeklyIfNeeded() {
        LocalDate targetWeek = targetWeekStartDate();
        if (repo.existsByWeekStartDate(targetWeek)) return;
        generateForWeek(targetWeek);
    }

    public LocalDate targetWeekStartDate() {
        LocalDate nextMonday = LocalDate.now().with(TemporalAdjusters.next(DayOfWeek.MONDAY));
        return nextMonday.plusWeeks(1);
    }

    public void generateForWeek(LocalDate weekStart) {
        // ✅ 이번주 식단표에서 나온 "가장 인기 없는 반찬" (데모용 하드코딩)
        //    순서: 다음주 월, 화, 수, 목, 금에 하나씩 넣을 메뉴
        List<String> worstThisWeek = List.of(
                "미역줄기볶음", // 다음주 월요일에 들어갈 최악 반찬
                "김치전",      // 다음주 화요일
                "도라지무침",  // 다음주 수요일
                "오이무침",    // 다음주 목요일
                "계란찜"       // 다음주 금요일 (지금은 임시, 나중에 AI 결과로 바꿔도 됨)
        );

        // ✅ 카테고리별 메뉴 풀 (원래 있던 코드 그대로)
        List<String> ricePool  = menuProvider.getRiceList();
        List<String> soupPool  = menuProvider.getSoupList();
        List<String> mainPool  = menuProvider.getMainDishList();
        List<String> subPool   = menuProvider.getSubMenuList();
        List<String> namulPool = menuProvider.getNamulList();

        Random random = new Random();
        List<MenuRecommendation> out = new ArrayList<>();

        for (int i = 0; i < 5; i++) {
            String rice  = ricePool.get(random.nextInt(ricePool.size()));
            String soup  = soupPool.get(random.nextInt(soupPool.size()));
            String main  = mainPool.get(random.nextInt(mainPool.size()));
            String sub   = subPool.get(random.nextInt(subPool.size()));
            String namul = namulPool.get(random.nextInt(namulPool.size()));

            String worstSide = worstThisWeek.get(i);

            MenuRecommendation mr = new MenuRecommendation();
            mr.setWeekStartDate(weekStart);

            mr.setDayOfWeek(DayOfWeek.MONDAY.plus(i).getValue());
            mr.setRice(rice);
            mr.setSoup(soup);
            mr.setMain(main);
            mr.setSide1(worstSide); // 이번주 최악 반찬
            mr.setSide2(namul);     // 나물 랜덤 (그냥 장식)

            mr.setNotes("auto-generated-with-worst");
            out.add(mr);
        }

        repo.saveAll(out);
    }


    /**
     * 메뉴 분석 (잔반율 조회)
     *
     *
     * @param menus 분석 대상 메뉴 리스트
     * @return 메뉴명 -> 잔반율 (0.0 ~ 1.0), 데이터 없으면 null
     */
    public Map<String, Double> analyzeMenu(List<String> menus) {
        // 최근 60일(약 2달)간의 데이터를 집계하여 충분한 표본 확보
        Map<String, Double> stats = aggregateLastDays(60);
        Map<String, Double> result = new HashMap<>();

        for (String menu : menus) {
            // O(1) 조회를 위해 Map 구조 활용
            result.put(menu, stats.getOrDefault(menu, null));
        }
        return result;
    }
    /**
     * AI 식단 추천 (대체 메뉴 제안)
     *
     * 무조건적인 메뉴 변경은 혼란을 줄 수 있음. 따라서 확실한 데이터(잔반율 0.6 이상)가 있을 때만 개입하도록 설정함.
     *
     * FLOW
     * 1. 분석: 현재 메뉴들의 잔반율을 먼저 확인함 (analyzeMenu 재활용).
     * 2. 임계치 설정: 잔반율 60%(0.6)를 '위험 수준'으로 정의. 이보다 낮으면 굳이 바꾸지 않고 유지함.
     * 3. 계층적 대체 전략:
     *      대체 메뉴 고려시, 잔반율만을 확인한다면
     *      매번 통계상 높은것을 고르면 바꿀때마다 똑같은 메뉴로 바뀌게될것
     *      (월요일 메인도 치킨, 금요일 메인도 치킨)
     *
     *    - 1단계: '영양학적/맛 조화를 고려해' 미리 정의된 '대체 맵' 사용 (예: 시금치->콩나물).
     *      단, 대체할 메뉴조차 비선호라면(highWasteGlobal) 과감히 포기하고 다음 단계로
     *
     *    - 2단계: 같은 카테고리 풀(Pool) 내에서 잔반율 낮은 메뉴를 랜덤 추천.
     *      최소한 '지금보다는 나은' 메뉴를 제안하기 위해
     */
    public Map<String, String> recommendSubstitute(List<String> currentMenus) {
        Map<String, Double> analysis = analyzeMenu(currentMenus); // 현재 메뉴 잔반율 분석
        // 교체 후보군 검증을 위해 충분히 긴 기간(60일) 데이터 사용(보통 이번주에 나온 메뉴가 다음주에 바로 나오진 않기때문, 통계 집계 기간을 대폭 늘려서 해결)
        Map<String, Double> globalStats = aggregateLastDays(60);
        Set<String> highWasteGlobal = new HashSet<>(); // 전체 중 비선호 메뉴 집합
        globalStats.forEach((food, avg) -> { if (avg != null && avg >= 0.6) highWasteGlobal.add(food); });

        // 대체 맵 (비선호 -> 대체)
        // Map.of는 10개 제한이 있어 Map.ofEntries 사용한다
        Map<String, String> substituteMap = Map.ofEntries(
                // 1. 밥
                Map.entry("흰쌀밥", "잡곡밥"),
                Map.entry("잡곡밥", "흑미밥"),
                Map.entry("흑미밥", "차조밥"),

                // 2. 국
                Map.entry("김치찌개", "된장국"),
                Map.entry("된장국", "순두부찌개"),
                Map.entry("미역국", "소고기무국"),
                Map.entry("소고기무국", "갈비탕"),
                Map.entry("육개장", "곰탕"),
                Map.entry("콩나물국", "북엇국"),
                Map.entry("어묵국", "감자양파국"),

                // 3. 메인 (고기<->고기, 생선<->생선)
                Map.entry("제육볶음", "불고기"),
                Map.entry("불고기", "소갈비찜"),
                Map.entry("간장닭조림(찜닭)", "닭갈비"),
                Map.entry("고등어구이", "삼치구이"),
                Map.entry("삼치구이", "가자미구이"),
                Map.entry("돈까스", "탕수육"),
                Map.entry("함박스테이크", "떡갈비"),
                Map.entry("오징어볶음", "낙지볶음"),
                Map.entry("보쌈", "훈제오리"),

                // 4. 서브
                Map.entry("계란찜", "메추리알장조림"),
                Map.entry("김치전", "군만두"),
                Map.entry("멸치볶음", "김자반"),
                Map.entry("국물떡볶이", "소세지야채볶음"),
                Map.entry("잡채", "어묵볶음"),

                // 5. 나물
                Map.entry("시금치무침", "콩나물무침"),
                Map.entry("콩나물무침", "숙주나물"),
                Map.entry("오이무침", "무생채"),
                Map.entry("미역줄기볶음", "고사리나물"),
                Map.entry("도라지무침", "애호박볶음")
        );

        Random random = new Random();
        Map<String, String> result = new LinkedHashMap<>(); // 원래 메뉴 -> 추천(변경) 메뉴

        for (String menu : currentMenus) {
            Double wasteRate = analysis.get(menu);
            // 잔반율이 높지 않거나 데이터가 없으면 그대로 유지 (continue;)
            if (wasteRate == null || wasteRate < 0.6) {
                result.put(menu, menu);
                continue;
            }

            // 비선호 메뉴인 경우 대체 시도
            String sub = substituteMap.get(menu);

            // 1. 대체 맵에 있고, 그 대체 메뉴도 비선호가 아니라면 선택
            if (sub != null && !highWasteGlobal.contains(sub)) {
                result.put(menu, sub);
            } else {
                // 2. 대체 맵에 없으면 같은 카테고리 풀에서 랜덤 추천 (단, 비선호 제외)
                List<String> pool = findCategoryPool(menu);
                String newMenu = choosePreferLowWaste(pool, highWasteGlobal, substituteMap, random);
                result.put(menu, newMenu);
            }
        }
        return result;
    }

    // 메뉴가 속한 카테고리 풀 찾기
    private List<String> findCategoryPool(String menu) {
        if (menuProvider.getRiceList().contains(menu)) return menuProvider.getRiceList();
        if (menuProvider.getSoupList().contains(menu)) return menuProvider.getSoupList();
        if (menuProvider.getMainDishList().contains(menu)) return menuProvider.getMainDishList();
        if (menuProvider.getSubMenuList().contains(menu)) return menuProvider.getSubMenuList();
        if (menuProvider.getNamulList().contains(menu)) return menuProvider.getNamulList();
        return Collections.emptyList(); // 못 찾으면 빈 리스트
    }

    /**
     * 최근 n일간의 잔반율 통계 집계하는 함수
     *
     * [통계 처리 방식에 대한 고민]
     * 일별 데이터는 그날의 컨디션이나 날씨 등에 따라 들쭉날쭉할 수 있음. 이를 보정하기 위해 이동 평균(Moving Average) 개념을 차용함.
     *
     * 1. 집계 기간: 최근 n일을 대상으로 하여, 너무 오래된 데이터가 현재 판단을 흐리지 않도록 함.
     * 2. 병합 로직:
     *    - 여러 날짜에 걸쳐 동일 메뉴가 등장했다면, 단순히 더해서 나누는 평균 방식을 사용.
     *    - (a + b) / 2.0 로직은 다소 단순화된 가중치 방식인데, 향후 데이터가 쌓이면 '최근 데이터에 더 높은 가중치'를 주는 지수 이동 평균(EMA)으로 고도화할 여지를 남겨둠.
     */
    private Map<String, Double> aggregateLastDays(int days) {
        Map<String, Double> acc = new HashMap<>();
        for (int i = 0; i < days; i++) {
            LocalDate d = LocalDate.now().minusDays(i);
            Map<String, Double> m = statsService.averagesForDate(d);
            for (var e : m.entrySet()) {
                acc.merge(e.getKey(), e.getValue(), (a, b) -> (a + b) / 2.0);
            }
        }
        return acc;
    }

    private String choosePreferLowWaste(List<String> pool, Set<String> highWaste, Map<String, String> substitute, Random random) {
        List<String> candidates = pool.stream().filter(p -> !highWaste.contains(p)).toList();
        if (!candidates.isEmpty()) return candidates.get(random.nextInt(candidates.size()));
        for (String p : pool) {
            String sub = substitute.get(p);
            if (sub != null && !highWaste.contains(sub)) return sub;
        }
        return pool.get(random.nextInt(pool.size()));
    }

    /**
     * 다음주 식단표를 요일별 강제 서브반찬을 반영하여 생성
     *
     * forcedSides 예시:
     * {
     *   "mon": "두부조림",
     *   "tue": "멸치볶음",
     *   "wed": "어묵볶음",
     *   "thu": "두부",
     *   "fri": "AI가 계산한 서브반찬"
     * }
     */
    public List<MenuRecommendation> generateNextWeekWithForcedSides(Map<String, String> forcedSides) {

        LocalDate weekStart = targetWeekStartDate();

        // 1) 이번에 제안했던 "다음주 식단표"를 요일 순으로 DB에서 가져오기
        List<MenuRecommendation> menus = repo.findByWeekStartDateOrderByDayOfWeekAsc(weekStart);

        // 2) 만약 아직 생성된 데이터가 없다면 먼저 생성 후 다시 조회
        if (menus.isEmpty()) {
            generateForWeek(weekStart);
            menus = repo.findByWeekStartDateOrderByDayOfWeekAsc(weekStart);
        }

        // 3) 서브 반찬(side1)만 대체 반영
        for (MenuRecommendation mr : menus) {

            String key = switch (mr.getDayOfWeek()) {
                case 1 -> "mon";
                case 2 -> "tue";
                case 3 -> "wed";
                case 4 -> "thu";
                case 5 -> "fri";
                default -> null;
            };

            if (key == null) continue;

            String forcedSide = forcedSides.get(key);

            if (forcedSide != null && !forcedSide.isBlank()) {
                mr.setSide1(forcedSide);          // ⭐ 기존 메뉴의 side1만 변경
                mr.setNotes("generated-with-forced-sides");
            }
        }

        // 4) 반영된 결과를 DB에 저장 후 리턴
        return repo.saveAll(menus);
    }



}
