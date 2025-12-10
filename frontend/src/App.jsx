import { useState, useEffect, useRef } from "react";
import "./App.css";

function App() {
  // 🔥 로딩 관련 상태
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [loadingIndex, setLoadingIndex] = useState(0);

  const loadingMessages = [
    "이미지 정리중...",
    "AI가 반찬을 분석하는 중...",
    "대체 반찬을 계산하는 중...",
    "메뉴 추천 알고리즘 실행중...",
  ];

  // 🔥 현재 로딩 문구 인덱스
  const fileInputRef = useRef(null);
  const captureRef = useRef(null);

  const [weeklyPlan, setWeeklyPlan] = useState(null);
  const [mode, setMode] = useState("guest");
  const [page, setPage] = useState("home");
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const [dishes, setDishes] = useState([
    { name: "", count: "" },
    { name: "", count: "" },
    { name: "", count: "" },
    { name: "", count: "" },
  ]);
  const [distributedDishes, setDistributedDishes] = useState([]);

  const [uploadedDays, setUploadedDays] = useState({
    월: true,
    화: true,
    수: true,
    목: true,
    금: false,
  });

  const [fridayAnalysisResult, setFridayAnalysisResult] = useState(null);

  const [mockResults] = useState({
    월: {
      ratios: { 메추리알: 4.1, 잡채: 7.2, 미역줄기볶음: 8.6 },
      leastPopular: "미역줄기볶음",
      related: ["고사리나물", "숙주무침"],
    },
    화: {
      ratios: { 고등어구이: 4.3, 김치전: 5.4, 콩나물무침: 4.2 },
      leastPopular: "김치전",
      related: ["군만두", "감자전"],
    },
    수: {
      ratios: { 깍두기: 3.2, 멸치볶음: 4.5, 도라지무침: 7.4 },
      leastPopular: "도라지무침",
      related: ["애호박볶음", "브로콜리"],
    },
    목: {
      ratios: { 새우튀김: 1.5, 떡볶이: 3.3, 오이무침: 5.5 },
      leastPopular: "오이무침",
      related: ["두부무침", "무생채"],
    },
  });

  // 🔥 분석 결과에서 요일별 가장 인기 없는 반찬을 저장
  const weeklyLeast = {
    월: mockResults.월.leastPopular,
    화: mockResults.화.leastPopular,
    수: mockResults.수.leastPopular,
    목: mockResults.목.leastPopular,
    금: fridayAnalysisResult?.leastPopular ?? "-",
  };

  // 🔥 대체 반찬 매핑
  const replacementMap = {
    미역줄기볶음: "숙주무침",
    김치전: "감자전",
    도라지무침: "브로콜리",
    오이무침: "무생채",
    계란찜: "두부조림",
    무생채: "콩나물무침",
    시금치: "브로콜리",
    김자반: "멸치볶음",
  };

  // 🔥 카테고리별 DB
  const riceDB = [
    "흰쌀밥",
    "잡곡밥",
    "기장밥",
    "귀리밥",
    "차조밥",
    "흑미밥",
    "흰쌀밥",
    "흰쌀밥",
    "흰쌀밥",
    "흰쌀밥",
  ];

  const soupDB = [
    "된장국",
    "김치찌개",
    "미역국",
    "어묵국",
    "순두부찌개",
    "소고기무국",
    "갈비탕",
    "육개장",
    "부엇국",
    "곰탕",
    "콩나물국",
  ];

  const mainDB = [
    "제육볶음",
    "고등어구이",
    "닭갈비",
    "갈치조림",
    "불고기",
    "소갈비찜",
    "간장닭조림",
    "삼치구이",
    "가자미구이",
    "돈까스",
    "탕수육",
    "떡갈비",
    "낙지볶음",
    "보쌈",
    "훈제오리",
  ];

  const subDB = [
    "계란찜",
    "김치전",
    "시금치",
    "어묵볶음",
    "두부조림",
    "멸치볶음",
    "브로콜리",
    "오이무침",
    "고사리나물",
    "미역줄기볶음",
    "메추리알장조림",
    "국물떡볶이",
    "소세지야채볶음",
    "잡채",
    "군만두",
    "김자반"
  ];

  const namulDB = [
    "콩나물무침",
    "무생채",
    "고사리나물",
    "도라지무침",
    "숙주무침",
    "미역줄기볶음",
    "오이무침",
    "애호박볶음",
    "궁채나물",
  ];

  const menuDB = [
    { category: "밥", name: "흰쌀밥" },
    { category: "국", name: "된장국" },
    { category: "메인", name: "제육볶음" },
    { category: "메인", name: "고등어구이" },
    { category: "서브", name: "계란찜" },
    { category: "서브", name: "김자반" },
    { category: "서브", name: "시금치" },
    { category: "서브", name: "두부조림" },
    { category: "서브", name: "멸치볶음" },
    { category: "서브", name: "브로콜리" },
    { category: "서브", name: "어묵볶음" },
  ];

  const saveAsImage = async () => {
    if (!window.html2canvas) {
      const script = document.createElement("script");
      script.src = "https://html2canvas.hertzen.com/dist/html2canvas.min.js";
      document.body.appendChild(script);
      await new Promise((res) => (script.onload = res));
    }

    if (window.html2canvas && captureRef.current) {
      const canvas = await window.html2canvas(captureRef.current,{
        useCORS: true,
        scale: 2,
      });
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = "menu_plan.png";
      a.click();
    }
  };

  const handleUpload = async () => {
    const files = fileInputRef.current.files;
    if (!files || files.length === 0)
      return alert("업로드할 사진을 선택하세요.");

    if (selectedDay !== "금")
      return alert("현재는 금요일만 업로드 가능합니다.");

    const form = new FormData();
    for (let i = 0; i < files.length; i++) form.append("images", files[i]);

    try {
      const res = await fetch(
        "http://zongsul-env.eba-xmxykbwh.ap-northeast-2.elasticbeanstalk.com/analysis/upload",
        {
          method: "POST",
          body: form,
        },
      );

      if (!res.ok) return alert("사진 업로드 실패");

      alert("금요일 사진 업로드 완료되었습니다.");
      setUploadedDays((prev) => ({ ...prev, [selectedDay]: true }));
      setPage("manage");
    } catch (err) {
      alert("서버 연결 오류");
    }
  };

  const generateMenuPlan = () => {
    const days = ["월", "화", "수", "목", "금"];
    const result = [];

    days.forEach((day) => {
      const least = weeklyLeast[day];
      const substitute = replacementMap[least] || "(대체 없음)";

      // 밥 / 국 / 메인 = 랜덤
      const rice = riceDB[Math.floor(Math.random() * riceDB.length)];
      const soup = soupDB[Math.floor(Math.random() * soupDB.length)];
      const main = mainDB[Math.floor(Math.random() * mainDB.length)];

      // 🔥 서브/나물 직접 구성
      // 1) leastPopular는 반드시 포함 (원본)
      // 2) 다른 항목은 랜덤으로 하나 배정

      let subSide = least;
      let namul;

      if (subDB.includes(least)) {
        // least가 서브 반찬이면 → 나물은 랜덤
        namul = namulDB[Math.floor(Math.random() * namulDB.length)];
      } else if (namulDB.includes(least)) {
        // least가 나물이면 → 서브는 랜덤
        subSide = subDB[Math.floor(Math.random() * subDB.length)];
        namul = least;
      } else {
        // 둘 다 해당 없음 → 그냥 랜덤
        subSide = subDB[Math.floor(Math.random() * subDB.length)];
        namul = namulDB[Math.floor(Math.random() * namulDB.length)];
      }

      result.push({
        day,
        rice,
        soup,
        main,
        sub: subSide,
        namul,
        replacedFrom: least,
        replacedTo: substitute,
      });
    });

    return result;
  };

  const handleGuestDistribute = async () => {
    try {
      const response = await fetch(
        "http://zongsul-env.eba-xmxykbwh.ap-northeast-2.elasticbeanstalk.com/distribution/active",
      );

      if (!response.ok) {
        alert("서버 오류");
        return;
      }

      const data = await response.json();

      const formatted = data.map((session) => {
        const slots = Array(session.capacity).fill(null);

        session.claims.forEach((claim, index) => {
          if (index < session.capacity) {
            slots[index] = {
              name: claim.name,
              studentId: claim.studentId,
              done: claim.done,
            };
          }
        });

        return { sessionId: session.id, name: session.menuName, slots };
      });

      setDistributedDishes(formatted);
    } catch (err) {
      console.error("서버 연결 실패:", err);
    }
  };

  useEffect(() => {
    if (page === "analysisMenuPlan" && !weeklyPlan) {
      // 금요일 분석 결과 받아온 leastPopular 전달
      setWeeklyPlan(generateMenuPlan(fridayAnalysisResult?.leastPopular));
    }
  }, [page, fridayAnalysisResult]);

  useEffect(() => {
    if (page !== "analysisStart") return;

    setAnalysisComplete(false);
    setLoadingIndex(0);

    const startTime = Date.now();

    // 🔥 1.5초마다 로딩 문구 변경
    const msgTimer = setInterval(() => {
      setLoadingIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 1500);

    // 🔥 실제 서버 분석 요청
    const fetchResult = async () => {
      try {
        const res = await fetch(
          "http://zongsul-env.eba-xmxykbwh.ap-northeast-2.elasticbeanstalk.com/analysis/result",
        );
        const data = await res.json();
        setFridayAnalysisResult(data);

        // 🔥 최소 3초 로딩 보장
        const MIN = 3000;
        const elapsed = Date.now() - startTime;
        const delay = Math.max(0, MIN - elapsed);

        setTimeout(() => {
          setAnalysisComplete(true);
          clearInterval(msgTimer);
        }, delay);
      } catch (err) {
        console.error("분석 실패", err);
        setTimeout(() => {
          setAnalysisComplete(true);
          clearInterval(msgTimer);
        }, 3000);
      }
    };

    fetchResult();

    return () => clearInterval(msgTimer);
  }, [page]);

  // 자동 로그인
  useEffect(() => {
    const savedName = localStorage.getItem("name");
    const savedStudentId = localStorage.getItem("studentId");

    if (savedName && savedStudentId) {
      setName(savedName);
      setStudentId(savedStudentId);
      alert(`${savedName}님, 자동 로그인되었습니다!`);
      setMode("guest");

      handleGuestDistribute();
    }
  }, []);

  // 학생용 잔반 현황 들어올 때마다 새로 가져오기
  useEffect(() => {
    if (page === "guestDistribution") handleGuestDistribute();
  }, [page]);

  const handleLogin = async () => {
    if (!name.trim() || !studentId.trim()) {
      alert("이름과 학번을 모두 입력하세요!");
      return;
    }
    try {
      const response = await fetch(
        "http://zongsul-env.eba-xmxykbwh.ap-northeast-2.elasticbeanstalk.com/api/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, studentId }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("name", data.name);
        localStorage.setItem("studentId", data.studentId);
        alert(`로그인 성공: ${data.name} (${data.studentId})`);
        setMode("guest");
        handleGuestDistribute();
      } else {
        alert("로그인 실패");
      }
    } catch (err) {
      console.error("서버 요청 실패:", err);
      alert("서버 연결 오류");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("name");
    localStorage.removeItem("studentId");
    setName("");
    setStudentId("");
    alert("로그아웃되었습니다.");
    setPage("home");
  };

  const AdminStatusBoard = ({ distributedDishes, setDistributedDishes }) => {
    const onClick = async (dishIndex, slotIndex) => {
      const slot = distributedDishes[dishIndex].slots[slotIndex];

      // 신청자가 없을 때
      if (!slot) {
        return alert("아직 신청한 학생이 없습니다.");
      }

      // 이미 완료 처리된 경우
      if (slot.done) {
        return alert("이미 배포 완료 처리된 반찬입니다.");
      }

      // 학번 입력
      const inputId = prompt("본인 확인을 위해 학번을 입력하세요:");
      if (!inputId) return;

      // 학번 검증
      if (inputId !== slot.studentId) {
        return alert("학번이 일치하지 않습니다.");
      }

      // 완료 처리 요청
      await fetch(
        `http://zongsul-env.eba-xmxykbwh.ap-northeast-2.elasticbeanstalk.com/distribution/${distributedDishes[dishIndex].sessionId}/done`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userName: slot.name,
            studentId: slot.studentId,
          }),
        },
      );

      // UI 반영
      setDistributedDishes((prev) => {
        const copy = [...prev];
        copy[dishIndex].slots[slotIndex] = {
          ...slot,
          done: true,
        };
        return copy;
      });

      alert("배포 완료 처리되었습니다!");
    };

    return (
      <main className="main admin-main">
        {distributedDishes.map((dish, idx) => (
          <div key={idx} className="dish-board">
            {/* 메뉴 헤더 */}
            <div className="menu-header">
              <span className="menu-title">{dish.name}</span>
              <span className="menu-count">
                신청자 {dish.slots.filter((s) => s && !s.done).length}명
              </span>
            </div>

            {/* 슬롯 목록 */}
            <div className="slot-grid">
              {dish.slots.map((slot, j) => (
                <div
                  key={j}
                  onClick={() => onClick(idx, j)}
                  className={`slot-card ${
                    slot?.done
                      ? "slot-done"
                      : slot
                        ? "slot-filled"
                        : "slot-empty"
                  }`}
                >
                  {slot ? (
                    <div className="slot-content">
                      <div className="slot-avatar">
                        {slot.done ? "✔" : "👤"}
                      </div>

                      <div className="slot-text">
                        {slot.done ? (
                          <>
                            <div className="slot-name">완료</div>
                            <div className="slot-id">
                              {slot.name} ({slot.studentId})
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="slot-name">{slot.name}</div>
                            <div className="slot-id">{slot.studentId}</div>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="slot-empty-text">신청자 없음</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </main>
    );
  };

  const DistributionBoard = ({ editable }) => {
    const handleClick = async (dishIndex, slotIndex) => {
      const current = localStorage.getItem("name") || "이름없음";
      const studentId = localStorage.getItem("studentId");

      const target = distributedDishes[dishIndex];
      const slotObj = target.slots[slotIndex];
      const sessionId = target.sessionId;

      // ✅ 이미 배포 완료된 슬롯은 누구도 변경 불가
      if (slotObj?.done) {
        return alert("이미 배포 완료 처리된 반찬입니다.");
      }

      // ✅ 관리자 화면에서만: 슬롯 비우기(오류 수정용)
      if (editable) {
        setDistributedDishes((prev) => {
          const copy = [...prev];
          copy[dishIndex].slots[slotIndex] = null;
          return copy;
        });
        return;
      }

      // 여기부턴 손님용 로직

      // 다른 사람 슬롯 클릭 시
      if (slotObj && slotObj.name !== current) {
        return alert("이미 다른 사람이 선택한 칸입니다.");
      }

      // 같은 반찬 여러 칸 신청 방지
      const alreadyTaken = target.slots.some((s) => s && s.name === current);
      if (!slotObj && alreadyTaken)
        return alert("이미 이 반찬을 신청했습니다.");

      // 내 슬롯이면 → 취소
      if (slotObj && slotObj.name === current) {
        try {
          const res = await fetch(
            `http://zongsul-env.eba-xmxykbwh.ap-northeast-2.elasticbeanstalk.com/distribution/${sessionId}/cancel`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userName: current, studentId }),
            },
          );

          if (!res.ok) return alert("취소 실패 (서버 오류)");

          setDistributedDishes((prev) => {
            const copy = [...prev];
            copy[dishIndex].slots[slotIndex] = null;
            return copy;
          });

          await handleGuestDistribute();
        } catch (err) {
          alert("취소 요청 중 서버 오류");
        }
        return;
      }

      // 새로 신청
      const emptyIndex = target.slots.findIndex((s) => !s);
      if (emptyIndex === -1) return alert("이미 모두 신청 완료된 반찬입니다.");

      try {
        const res = await fetch(
          `http://zongsul-env.eba-xmxykbwh.ap-northeast-2.elasticbeanstalk.com/distribution/${sessionId}/claim`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userName: current, studentId }),
          },
        );

        if (!res.ok) {
          let errMsg = null;
          try {
            errMsg = await res.json();
          } catch {}
          return alert(`신청 실패: ${errMsg?.message || res.status}`);
        }

        setDistributedDishes((prev) => {
          const copy = [...prev];
          copy[dishIndex].slots[emptyIndex] = {
            name: current,
            studentId,
            done: false,
          };
          return copy;
        });

        await handleGuestDistribute();
      } catch (err) {
        alert("서버 연결 오류");
      }
    };

    return (
      <main className="main">
        {distributedDishes.map((dish, i) => (
          <div key={i} className="dish-board">
            {/* 상단 메뉴 정보 */}
            <div className="menu-header">
              <span className="menu-title">{dish.name}</span>
              <span className="menu-count">
                신청자 {dish.slots.filter((s) => s).length}명
              </span>
            </div>

            {/* 신청자 슬롯 리스트 */}
            <div className="slot-grid">
              {dish.slots.map((slot, j) => {
                const isDone = !!slot?.done;
                const isMine =
                  slot && slot.name === localStorage.getItem("name");

                const cardClass = `slot-card ${
                  isDone ? "slot-done" : slot ? "slot-filled" : "slot-empty"
                }`;

                return (
                  <div
                    key={j}
                    onClick={() => handleClick(i, j)}
                    className={cardClass}
                    style={{
                      opacity:
                        !editable && slot && !isDone && !isMine ? 0.6 : 1,
                      cursor: isDone ? "default" : "pointer",
                    }}
                  >
                    {/* ✅ 완료된 슬롯 UI */}
                    {slot && slot.done ? (
                      <div className="slot-content">
                        <div className="slot-avatar">✔</div>
                        <div className="slot-text">
                          <div className="slot-name">완료</div>
                          <div className="slot-id">
                            {slot.name} ({slot.studentId})
                          </div>
                        </div>
                      </div>
                    ) : slot ? (
                      // ✅ 일반 신청자 슬롯 UI
                      <div className="slot-content">
                        <div className="slot-avatar">👤</div>
                        <div className="slot-text">
                          <div className="slot-name">{slot.name}</div>
                          <div className="slot-id">{slot.studentId}</div>
                        </div>
                      </div>
                    ) : (
                      // ✅ 빈 슬롯 UI
                      <div className="slot-empty-text">신청하기</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </main>
    );
  };

  // ---------------- 페이지 분기 ----------------

  if (page === "manage") {
    const days = ["월", "화", "수", "목", "금"];

    const handleDayClick = (day) => {
      if (day !== "금") return;
      setSelectedDay(day);
      setPage("upload");
    };

    const startAnalysis = () => {
      const allUploaded = Object.values(uploadedDays).every(Boolean);
      if (!allUploaded) return alert("잔반 사진이 전부 들어오지 않았습니다.");

      setPage("analysisStart");
    };

    return (
      <div>
        <header className="header" onClick={() => setPage("home")}>
          잔반이들
        </header>

        <main className="main">
          <div className="week-container">
            <div className="week-bar">
              {days.map((day) => (
                <div
                  key={day}
                  className={`day-box ${day === "금" ? "active" : "disabled"}`}
                  onClick={() => handleDayClick(day)}
                  style={{
                    cursor: day === "금" ? "pointer" : "not-allowed",
                    opacity: day === "금" ? 1 : 0.5,
                    backgroundColor: day === "금" ? "#fff" : "#f5f5f5",
                  }}
                >
                  {day}
                </div>
              ))}
            </div>

            <button className="analyze-btn" onClick={startAnalysis}>
              잔반 분석 시작
            </button>
          </div>
        </main>

        <footer className="footer">
          <button onClick={() => setPage("home")}>학생용</button>
          <button onClick={() => setPage("home")}>관리자용</button>
        </footer>
      </div>
    );
  }

  if (page === "upload") {
    return (
      <div>
        <header className="header" onClick={() => setPage("manage")}>
          잔반이들: {selectedDay}요일
        </header>

        <main className="main-upload-container">
          <h2>{selectedDay}요일 사진 업로드</h2>
          <input ref={fileInputRef} type="file" multiple accept="image/*" />
          <p>여러 장의 사진을 선택할 수 있습니다.</p>
          <button onClick={handleUpload}>사진 업로드</button>
          <button className="back-btn" onClick={() => setPage("manage")}>
            뒤로가기
          </button>
        </main>

        <footer className="footer">
          <button onClick={() => setPage("home")}>학생용</button>
          <button onClick={() => setPage("home")}>관리자용</button>
        </footer>
      </div>
    );
  }

  if (page === "analysisStart") {
    return (
      <div>
        <header className="header">잔반 분석</header>

        <main
          className="main-upload-container analysis-screen"
          style={{ textAlign: "center" }}
        >
          {/* 스피너 영역 (작게) */}
          <div style={{ height: "60px", marginBottom: "10px" }}>
            {!analysisComplete && <div className="loader"></div>}
          </div>

          {/* 제목 */}
          <h2 style={{ marginBottom: "10px" }}>
            {analysisComplete ? "잔반 분석 완료" : "잔반 분석중..."}
          </h2>

          {/* 메시지 (작게) */}
          <div style={{ height: "40px", marginBottom: "10px" }}>
            {!analysisComplete && (
              <p style={{ fontSize: "15px", color: "#555" }}>
                {loadingMessages[loadingIndex]}
              </p>
            )}
          </div>

          {/* 진행바 (작게) */}
          <div style={{ height: "22px", marginBottom: "25px" }}>
            {!analysisComplete && (
              <div className="progress-bar">
                <div className="progress-bar-inner"></div>
              </div>
            )}
          </div>

          {/* 버튼 고정 위치 */}
          <button
            disabled={!analysisComplete}
            onClick={() => setPage("analysisResults")}
            style={{
              marginTop: "10px",
              opacity: analysisComplete ? 1 : 0.5,
              cursor: analysisComplete ? "pointer" : "not-allowed",
            }}
          >
            다음
          </button>
        </main>
      </div>
    );
  }

  if (page === "analysisResults") {
    const combined = {
      월: mockResults.월,
      화: mockResults.화,
      수: mockResults.수,
      목: mockResults.목,
      금: fridayAnalysisResult ?? {
        ratios: {},
        leastPopular: "-",
        related: [],
      },
    };

    return (
      <div>
        <header className="header">분석 결과</header>

        <main
          className="analysis-results-container"
          style={{ paddingBottom: "60px" }}
        >
          <div className="analysis-grid">
            {Object.entries(combined).map(([day, data]) => (
              <div key={day} className="analysis-card analysis-board">
                {/* 🔥 요일 헤더 */}
                <div className="analysis-header-block">
                  <h3>{day}요일</h3>
                </div>

                {/* 🔥 비율 블록 */}
                <div className="analysis-section-box">
                  <div className="analysis-box-title">반찬 비율</div>
                  <div className="analysis-box-content">
                    {data.ratios && Object.entries(data.ratios).length > 0 ? (
                      Object.entries(data.ratios).map(([k, v]) => (
                        <p key={k}>
                          {k}: {v.toFixed(1)}%
                        </p>
                      ))
                    ) : (
                      <p>데이터 없음</p>
                    )}
                  </div>
                </div>

                {/* 🔥 인기 없는 반찬 블록 */}
                <div className="analysis-section-box">
                  <div className="analysis-box-title">가장 인기 없는 반찬</div>
                  <div className="analysis-box-content">
                    <p style={{ fontWeight: "600" }}>{data.leastPopular}</p>
                  </div>
                </div>

                {/* 🔥 관련 서브반찬 블록 */}
                <div className="analysis-section-box">
                  <div className="analysis-box-title">관련 추천 반찬</div>
                  <div className="analysis-box-content">
                    {(data.related || []).length > 0 ? (
                      <p>{data.related.join(", ")}</p>
                    ) : (
                      <p>추천 없음</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            className="analysis-next-btn"
            onClick={() => setPage("analysisMenuPlan")}
            style={{
              marginTop: "30px",
              width: "100%",
              maxWidth: "300px",
              alignSelf: "center",
            }}
          >
            다음
          </button>
        </main>
      </div>
    );
  }

  if (page === "finalMenuPlan") {
    if (!weeklyPlan) {
      return (
        <div>
          <header className="header">최종 식단표</header>
          <main className="analysis-results-container">
            <p style={{ textAlign: "center", marginTop: "40px" }}>
              식단 없음
            </p>
          </main>
        </div>
      );
    }

    // 🔥 실제 반영된 최종 식단 만들기
    const finalPlan = weeklyPlan.map((item) => {
      const { replacedFrom, replacedTo } = item;
      return {
        ...item,
        sub: item.sub === replacedFrom ? replacedTo : item.sub,
        namul: item.namul === replacedFrom ? replacedTo : item.namul,
      };
    });

    return (
      <div>
        <header className="header">최종 식단표</header>

        <main className="analysis-results-container" style={{ paddingBottom: "80px" }}>
          <h2 style={{ textAlign: "center", marginBottom: "30px" }}>
            대체 반영 완료된 최종 식단표
          </h2>

          <div ref={captureRef} className="analysis-grid">
            {finalPlan.map((p) => (
              <div key={p.day} className="analysis-card">

                {/* 요일 */}
                <h3 style={{ marginBottom: "10px" }}>{p.day}요일</h3>

                {/* 밥 */}
                <div className="analysis-section-box">
                  <div className="analysis-box-title">밥</div>
                  <div className="analysis-box-content">
                    <p>{p.rice}</p>
                  </div>
                </div>

                {/* 국 */}
                <div className="analysis-section-box">
                  <div className="analysis-box-title">국</div>
                  <div className="analysis-box-content">
                    <p>{p.soup}</p>
                  </div>
                </div>

                {/* 메인 */}
                <div className="analysis-section-box">
                  <div className="analysis-box-title">메인</div>
                  <div className="analysis-box-content">
                    <p>{p.main}</p>
                  </div>
                </div>

                {/* 서브 반찬 */}
                <div className="analysis-section-box">
                  <div className="analysis-box-title">서브 반찬</div>
                  <div className="analysis-box-content">
                    <p>{p.sub}</p>
                  </div>
                </div>

                {/* 나물 */}
                <div className="analysis-section-box">
                  <div className="analysis-box-title">나물</div>
                  <div className="analysis-box-content">
                    <p>{p.namul}</p>
                  </div>
                </div>

                {/* 대체 정보 */}
                <div
                  style={{
                    marginTop: "18px",
                    fontSize: "14px",
                    background: "#f7f9fc",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px dashed #ccc",
                  }}
                >
                  <strong>대체 정보</strong>
                  <br />
                  <p style={{ marginTop: "6px", color: "#444" }}>
                    {p.replacedFrom} → {p.replacedTo}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* 버튼 영역 */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
              marginTop: "40px",
              width: "100%",
            }}
          >
            <button className="menu-wide-btn" onClick={saveAsImage}>
              사진으로 저장
            </button>

            <button className="menu-wide-btn" onClick={() => setPage("home")}>
              종료
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (page === "analysisMenuPlan") {
    // 🔥 영양 근거 문구 매핑
    const nutritionReasons = {
      "미역줄기볶음→숙주무침":
        "미역줄기볶음은 섬유질이 풍부하고, 숙주무침에도 같은 성분이 포함되어 있어 자연스러운 대체가 가능합니다.",
      "김치전→감자전":
        "김치전은 탄수화물이 풍부하고, 감자전에도 같은 성분이 포함되어 있어 자연스러운 대체가 가능합니다.",
      "도라지무침→브로콜리":
        "도라지에는 항산화 성분이 들어 있으며, 브로콜리도 항산화와 비타민C가 풍부해 자연스럽게 대체할 수 있습니다.",
      "오이무침→무생채":
        "오이와 무는 모두 수분과 식이섬유가 풍부해 비슷한 식감과 영양을 유지할 수 있습니다.",
      "계란찜→두부조림":
        "계란찜은 단백질 공급원이고, 두부조림에도 같은 성분이 포함되어 있어 자연스러운 대체가 가능합니다.",
      "시금치→브로콜리":
        "시금치는 철분과 비타민이 풍부하고, 브로콜리에도 동일한 영양소가 포함되어 있어 적절한 대체입니다.",
      "김자반→멸치볶음":
        "김자반에는 칼슘이 들어 있고, 멸치볶음 역시 칼슘과 단백질을 제공해 영양 면에서 자연스러운 대체가 가능합니다.",
    };

    const days = ["월", "화", "수", "목", "금"];

    return (
      <div>
        <header className="header">다음주 식단 대체 제안</header>

        <main
          className="analysis-results-container"
          style={{ paddingBottom: "60px" }}
        >
          <h2 style={{ textAlign: "center", marginBottom: "30px" }}>
            왜 이 반찬이 바뀌었나요?
          </h2>

          <div className="analysis-grid">
            {days.map((day) => {
              const from = weeklyLeast[day];
              const to = replacementMap[from] ?? "-";

              const key = `${from}→${to}`;
              const reason =
                nutritionReasons[key] ?? "영양 균형을 고려한 대체입니다.";

              return (
                <div key={day} className="analysis-card analysis-board">
                  {/* 요일 */}
                  <div className="analysis-header-block">
                    <h3>{day}요일</h3>
                  </div>

                  {/* 변경 전 → 후 */}
                  <div className="analysis-section-box">
                    <div className="analysis-box-title">대체 반찬</div>
                    <div className="analysis-box-content">
                      <p>
                        <strong>{from}</strong> → <strong>{to}</strong>
                      </p>
                    </div>
                  </div>

                  {/* 영양 근거 */}
                  <div className="analysis-section-box">
                    <div className="analysis-box-title">대체 이유</div>
                    <div className="analysis-box-content">
                      <p>{reason}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 버튼 */}
          <button
            className="analysis-next-btn"
            onClick={() => setPage("finalMenuPlan")}
            style={{
              marginTop: "30px",
              width: "100%",
              maxWidth: "300px",
              alignSelf: "center",
            }}
          >
            최종 식단표 보기
          </button>
        </main>
      </div>
    );
  }

  if (page === "adminDistribution") {
    return (
      <div>
        <header className="header" onClick={() => setPage("home")}>
          🍱 관리자 잔반 배포
        </header>
        <DistributionBoard editable={true} />
        <footer className="footer">
          <button onClick={() => setPage("home")}>홈으로</button>
        </footer>
      </div>
    );
  }

  if (page === "adminStatus") {
    return (
      <div>
        <header className="header" onClick={() => setPage("home")}>
          🧑‍🍳 관리자용 잔반 관리 현황
        </header>

        <AdminStatusBoard
          distributedDishes={distributedDishes}
          setDistributedDishes={setDistributedDishes}
        />

        <footer className="footer">
          <button onClick={() => setPage("home")}>홈으로</button>
        </footer>
      </div>
    );
  }

  if (page === "guestDistribution") {
    return (
      <div>
        <header className="header" onClick={() => setPage("home")}>
          🍛 학생용 잔반 현황
        </header>
        <DistributionBoard editable={false} />

        <footer className="footer">
          <button onClick={() => setPage("home")}>홈으로</button>
          {localStorage.getItem("name") && (
            <button
              onClick={handleLogout}
              style={{
                marginLeft: "10px",
                backgroundColor: "#d9534f",
                color: "white",
              }}
            >
              로그아웃
            </button>
          )}
        </footer>
      </div>
    );
  }

  if (page === "distribute") {
    const handleDishChange = (index, field, value) => {
      const newDishes = [...dishes];
      newDishes[index][field] = value;
      setDishes(newDishes);
    };

    const handleSubmit = async () => {
      const filtered = dishes.filter((d) => d.name && d.count);
      if (filtered.length === 0) return alert("반찬 정보를 입력하세요!");

      try {
        const payload = filtered.map((dish) => ({
          menuName: dish.name,
          capacity: Number(dish.count),
        }));

        const res = await fetch(
          "http://zongsul-env.eba-xmxykbwh.ap-northeast-2.elasticbeanstalk.com/distribution/batch",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );

        if (!res.ok) return alert("반찬 등록 실패");

        const sessions = await res.json();

        const formatted = sessions.map((s) => ({
          sessionId: s.id,
          name: s.menuName,
          slots: Array(s.capacity).fill(""),
        }));

        setDistributedDishes(formatted);
        alert("잔반 배포가 시작되었습니다!");
        setPage("distributionBoard");
      } catch {
        alert("서버 연결 오류");
      }
    };

    return (
      <div>
        <header className="header" onClick={() => setPage("home")}>
          잔반 배포
        </header>

        <main className="main-upload-container">
          <h2>반찬 정보 입력 (최대 4개)</h2>
          {dishes.map((dish, idx) => (
            <div key={idx} style={{ marginBottom: "15px", width: "100%" }}>
              <input
                type="text"
                placeholder={`반찬 ${idx + 1} 이름`}
                value={dish.name}
                onChange={(e) => handleDishChange(idx, "name", e.target.value)}
                style={{ marginBottom: "8px" }}
              />
              <input
                type="number"
                placeholder={`반찬 ${idx + 1} 개수`}
                value={dish.count}
                onChange={(e) => handleDishChange(idx, "count", e.target.value)}
              />
            </div>
          ))}
          <button onClick={handleSubmit}>배포 시작</button>
          <button className="back-btn" onClick={() => setPage("home")}>
            뒤로가기
          </button>
        </main>
      </div>
    );
  }

  // 기본 홈 (학생 / 관리자 선택)
  return (
    <div>
      <header className="header" onClick={() => setMode("guest")}>
        잔반이들
      </header>

      <main className="main">
        {mode === "guest" ? (
          <div className="login-box">
            <h2>학생 로그인</h2>

            <input
              type="text"
              placeholder="이름을 입력하세요"
              value={name}
              onChange={(e) => setName(e.target.value)}
              readOnly={!!localStorage.getItem("name")}
              style={{
                backgroundColor: localStorage.getItem("name")
                  ? "#eee"
                  : "white",
                cursor: localStorage.getItem("name") ? "not-allowed" : "text",
              }}
            />

            <input
              type="text"
              placeholder="학번을 입력하세요"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              readOnly={!!localStorage.getItem("name")}
              style={{
                backgroundColor: localStorage.getItem("name")
                  ? "#eee"
                  : "white",
                cursor: localStorage.getItem("name") ? "not-allowed" : "text",
              }}
            />

            {!localStorage.getItem("name") && (
              <button onClick={handleLogin}>로그인</button>
            )}

            {localStorage.getItem("name") && (
              <>
                <button
                  style={{ marginTop: "10px" }}
                  onClick={() => {
                    handleGuestDistribute();
                    setPage("guestDistribution");
                  }}
                >
                  잔반 배포 현황 보기
                </button>

                <button
                  style={{
                    marginTop: "10px",
                    backgroundColor: "#d9534f",
                    color: "white",
                  }}
                  onClick={handleLogout}
                >
                  로그아웃
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="admin-box">
            <button onClick={() => setPage("manage")}>잔반 관리 시작</button>
            <button onClick={() => setPage("distribute")}>
              잔반 배포 시작 (입력)
            </button>
            <button onClick={() => setPage("adminStatus")}>
              잔반 배포 현황
            </button>
          </div>
        )}
      </main>

      <footer className="footer">
        <button
          className={mode === "guest" ? "active" : ""}
          onClick={() => {
            setMode("guest");
            setPage("home");
          }}
        >
          학생용
        </button>

        <button
          className={mode === "admin" ? "active" : ""}
          onClick={() => {
            setMode("admin");
            setPage("home");
          }}
        >
          관리자용
        </button>
      </footer>
    </div>
  );
}

export default App;
