import React, { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [menuData, setMenuData] = useState([]);
  const [viewMode, setViewMode] = useState("3");
  const [selectedDay, setSelectedDay] = useState("all");
  const [loading, setLoading] = useState(false);

  const fetchMenu = () => {
    setLoading(true);
    fetch("http://localhost:5000/api/menu")
      .then((res) => res.json())
      .then((data) => {
        setMenuData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching menu:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleGenerateNew = () => {
    setLoading(true);
    fetch("http://localhost:5000/api/generate")
      .then((res) => res.json())
      .then(() => {
        fetchMenu(); // Reload fresh menu after regeneration
      })
      .catch((err) => {
        console.error("Error regenerating:", err);
        setLoading(false);
      });
  };

  const getFilteredMenu = () => {
    if (selectedDay !== "all") {
      return menuData.filter((day) => day.day === selectedDay);
    }
    return viewMode === "3" ? menuData.slice(0, 3) : menuData;
  };

  const getPopularityTag = (score) => {
    if (score > 2.3) return "high";
    if (score >= 1.8) return "balanced";
    return "low";
  };

  const getPopularityLabel = (score) => {
    const tag = getPopularityTag(score);
    if (tag === "high") return "High Popularity";
    if (tag === "balanced") return "Balanced Popularity";
    return "Low Popularity";
  };

  return (
    <div className="App">
      <h1>🍽️ AI Weekly Menu Combos</h1>

      <div className="view-toggle">
        <button
          onClick={() => {
            setViewMode("3");
            setSelectedDay("all");
          }}
          className={viewMode === "3" && selectedDay === "all" ? "active" : ""}
        >
          Show 3 Days
        </button>

        <button
          onClick={() => {
            setViewMode("7");
            setSelectedDay("all");
          }}
          className={viewMode === "7" && selectedDay === "all" ? "active" : ""}
        >
          Show 7 Days
        </button>

        <select
          onChange={(e) => setSelectedDay(e.target.value)}
          value={selectedDay}
        >
          <option value="all">Select Specific Day</option>
          {menuData.map((day, idx) => (
            <option key={idx} value={day.day}>
              {day.day}
            </option>
          ))}
        </select>

        <button onClick={handleGenerateNew} className="generate-btn">
          🔁 Generate New Menu
        </button>
      </div>

      {loading ? (
        <h2>Loading menu...</h2>
      ) : (
        getFilteredMenu().map((dayData, idx) => (
          <div key={idx} className="day-section">
            <h2>{dayData.day}</h2>
            <p>
              <strong>Taste Preference:</strong> {dayData.taste_profile}
            </p>

            {dayData.combos.length > 0 ? (
              <>
                {dayData.combos.map((combo, index) => (
                  <div key={index} className="combo-card">
                    <h4>Combo #{combo.combo_id}</h4>
                    <p><strong>Main:</strong> {combo.main}</p>
                    <p><strong>Side:</strong> {combo.side}</p>
                    <p><strong>Drink:</strong> {combo.drink}</p>
                    <p><strong>Calories:</strong> {combo.total_calories}</p>
                    <p><strong>Popularity Score:</strong> {combo.popularity_score}</p>
                    <span className={`popularity-badge ${getPopularityTag(combo.popularity_score)}`}>
                      {getPopularityLabel(combo.popularity_score)}
                    </span>
                    <p><em>{combo.reasoning}</em></p>
                  </div>
                ))}
                <p style={{ marginTop: "1rem", fontWeight: "bold" }}>
                  🔥 Average Calories: {
                    Math.round(
                      dayData.combos.reduce((sum, c) => sum + c.total_calories, 0) / dayData.combos.length
                    )
                  } kcal
                </p>
              </>
            ) : (
              <p style={{ color: "red" }}>No combos found for this day.</p>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default App;
