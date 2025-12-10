package com.zongsul.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;

@Service
public class AnalysisService {

    private final InferenceClient inferenceClient;

    // 가장 최근 분석 결과 저장
    private FridayAnalysisResult latestFridayResult;

    public AnalysisService(InferenceClient inferenceClient) {
        this.inferenceClient = inferenceClient;
    }

    // -------------------------------
    // 1) 금요일 이미지 분석
    // -------------------------------
    public void analyzeFridayImages(List<MultipartFile> images) throws IOException {

        Map<String, Double> sum = new HashMap<>();
        int count = images.size();

        for (MultipartFile file : images) {
            Map<String, Double> result = inferenceClient.infer(
                    file.getBytes(),
                    file.getOriginalFilename()
            );

            for (String key : result.keySet()) {
                sum.merge(key, result.get(key), Double::sum);
            }
        }

        // 평균 계산
        Map<String, Double> avg = new HashMap<>();
        for (String key : sum.keySet()) {
            avg.put(key, sum.get(key) / count);
        }

        // 가장 적게 남은 반찬 찾기 (값이 *큰* 것이 많이 남았다는 뜻이라면 반대로 해야 함)
        String least = avg.entrySet()
                .stream()
                .max(Comparator.comparingDouble(Map.Entry::getValue))
                .map(Map.Entry::getKey)
                .orElse("없음");

        // 추천 매핑
        Map<String, List<String>> relatedMap = Map.of(
                "계란찜", List.of("두부조림", "야채무침"),
                "김자반", List.of("멸치볶음", "콩나물무침"),
                "시금치", List.of("브로콜리", "고사리나물")
        );

        List<String> related = relatedMap.getOrDefault(least, List.of());

        // 결과 저장
        latestFridayResult = new FridayAnalysisResult(avg, least, related);
    }

    // -------------------------------
    // 2) 최근 분석 결과 가져오기
    // -------------------------------
    public FridayAnalysisResult getLatestResult() {
        if (latestFridayResult == null) {
            return new FridayAnalysisResult(
                    Map.of("계란찜", 0.0, "김자반", 0.0, "시금치", 0.0),
                    "계란찜",
                    List.of("두부조림")
            );
        }
        return latestFridayResult;
    }
}
