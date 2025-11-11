import { useState } from "react";
import "./App.css";

function App() {
  const [mode, setMode] = useState("guest");
  const [page, setPage] = useState("home"); // home / manage / upload / distribute
  const [selectedDay, setSelectedDay] = useState("");
  const [dishes, setDishes] = useState([
    { name: "", count: "" },
    { name: "", count: "" },
    { name: "", count: "" },
    { name: "", count: "" },
  ]);

  // 🔹 사진 업로드 화면
  if (page === "upload") {
    return (
      <div>
        <header className="header" onClick={() => setPage("manage")}>
          잔반이들: {selectedDay}요일
        </header>

        <main className="main-upload-container">
          <h2>{selectedDay}요일 사진 업로드</h2>
          <input type="file" multiple accept="image/*" />
          <p>여러 장의 사진을 선택할 수 있습니다.</p>

          <button className="back-btn" onClick={() => setPage("manage")}>
            뒤로가기
          </button>
        </main>

        <footer className="footer">
          <button
            className={mode === "guest" ? "active" : ""}
            onClick={() => {
              setMode("guest");
              setPage("home");
            }}
          >
            손님용
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

  // 🔹 관리자용: 요일 + 파악하기 버튼
  if (page === "manage") {
    return (
      <div>
        <header
          className="header"
          onClick={() => {
            setPage("home");
            setMode("guest");
          }}
        >
          잔반이들
        </header>

        <main className="main">
          <div className="week-container">
            <div className="week-bar">
              {["월", "화", "수", "목", "금"].map((day) => (
                <div
                  key={day}
                  className="day-box"
                  onClick={() => {
                    setSelectedDay(day);
                    setPage("upload");
                  }}
                >
                  {day}
                </div>
              ))}
            </div>
            <button className="analyze-btn">파악하기</button>
            
          </div>
        </main>

        <footer className="footer">
          <button
            className={mode === "guest" ? "active" : ""}
            onClick={() => {
              setMode("guest");
              setPage("home");
            }}
          >
            손님용
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

  // 🔹 잔반 배포 화면
  if (page === "distribute") {
    const handleDishChange = (index, field, value) => {
      const newDishes = [...dishes];
      newDishes[index][field] = value;
      setDishes(newDishes);
    };

    const handleSubmit = () => {
      console.log("배포할 반찬:", dishes);
      alert("반찬 정보가 저장되었습니다!");
      setPage("home");
    };

    return (
      <div>
        <header className="header" onClick={() => setPage("manage")}>
          잔반 배포
        </header>

        <main className="main-upload-container">
          <h2>반찬 정보 입력 (총 4개)</h2>
          {dishes.map((dish, idx) => (
            <div key={idx} style={{ marginBottom: "15px", width: "100%" }}>
              <input
                type="text"
                placeholder={`반찬 ${idx + 1} 이름`}
                value={dish.name}
                onChange={(e) =>
                  handleDishChange(idx, "name", e.target.value)
                }
                style={{ marginBottom: "8px" }}
              />
              <input
                type="number"
                placeholder={`반찬 ${idx + 1} 개수`}
                value={dish.count}
                onChange={(e) =>
                  handleDishChange(idx, "count", e.target.value)
                }
              />
            </div>
          ))}
          <button onClick={handleSubmit}>저장</button>
          <button
            className="back-btn"
            onClick={() => setPage("home")}
            style={{ marginTop: "10px" }}
          >
            뒤로가기
          </button>
        </main>

        <footer className="footer">
          <button
            className={mode === "guest" ? "active" : ""}
            onClick={() => {
              setMode("guest");
              setPage("home");
            }}
          >
            손님용
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

  // 🔹 기본 홈 화면
  return (
    <div>
      <header className="header" onClick={() => setMode("guest")}>
        잔반이들
      </header>

      <main className="main">
        {mode === "guest" ? (
          <div className="login-box">
            <h2>손님 로그인</h2>
            <input type="text" placeholder="이름을 입력하세요" />
            <button>로그인</button>
          </div>
        ) : (
          <div className="admin-box">
            <button onClick={() => setPage("manage")}>잔반 관리 시작</button>
            <button onClick={() => setPage("distribute")}>잔반 배포 시작</button>
          </div>
        )}
      </main>

      <footer className="footer">
        <button
          className={mode === "guest" ? "active" : ""}
          onClick={() => setMode("guest")}
        >
          손님용
        </button>
        <button
          className={mode === "admin" ? "active" : ""}
          onClick={() => setMode("admin")}
        >
          관리자용
        </button>
      </footer>
    </div>
  );
}

export default App;
