const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const masterMenuPath = path.join(__dirname, "data", "master_menu.csv");
const outputPath = path.join(__dirname, "data", "output.json");

const tasteProfileMap = [
  "Sweet",
  "Spicy",
  "Savoury",
  "Sweet",
  "Spicy",
  "Savoury",
  "Sweet",
];

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function parseCSV(filepath) {
  return new Promise((resolve, reject) => {
    const items = [];
    fs.createReadStream(filepath)
      .pipe(csv())
      .on("data", (row) => {
        items.push({
          item_name: row.item_name,
          category: row.category.toLowerCase(),
          calories: parseInt(row.calories),
          taste_profile: row.taste_profile.toLowerCase(),
          popularity_score: parseFloat(row.popularity_score),
        });
      })
      .on("end", () => resolve(items))
      .on("error", reject);
  });
}

function getRandomSubset(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generateCombos(mains, sides, drinks) {
  const combos = [];
  let id = 1;

  for (let m of mains) {
    for (let s of sides) {
      for (let d of drinks) {
        const totalCalories = m.calories + s.calories + d.calories;
        const popularity = m.popularity_score + s.popularity_score + d.popularity_score;
        combos.push({
          combo_id: id++,
          main: m.item_name,
          side: s.item_name,
          drink: d.item_name,
          total_calories: totalCalories,
          popularity_score: parseFloat(popularity.toFixed(2)),
          dishes: new Set([m.item_name, s.item_name, d.item_name]),
          taste_matches: [m, s, d].filter(i => i.taste_profile === m.taste_profile).length,
          reasoning: `Includes items with '${m.taste_profile}' taste, calorie-controlled`
        });
      }
    }
  }

  return combos;
}

function isComboRepeated(combo, previousCombos) {
  return previousCombos.some(prev =>
    prev.main === combo.main &&
    prev.side === combo.side &&
    prev.drink === combo.drink
  );
}

async function generateWeeklyMenu() {
  const masterItems = await parseCSV(masterMenuPath);
  const mains = masterItems.filter(i => i.category === "main");
  const sides = masterItems.filter(i => i.category === "side");
  const drinks = masterItems.filter(i => i.category === "drink");

  const weeklyMenu = [];
  const usedCombos = [];

  for (let i = 0; i < 7; i++) {
    const tastePref = tasteProfileMap[i].toLowerCase();
    const day = days[i];

    let validCombos = [];
    let attempts = 0;

    while (validCombos.length < 3 && attempts < 7) {
      const dailyMains = getRandomSubset(mains, 5);
      const dailySides = getRandomSubset(sides, 4);
      const dailyDrinks = getRandomSubset(drinks, 4);

      const allCombos = generateCombos(dailyMains, dailySides, dailyDrinks);
      const filtered = allCombos.filter(combo =>
        combo.total_calories >= 550 &&
        combo.total_calories <= 800 &&
        combo.taste_matches >= 1 &&
        !isComboRepeated(combo, usedCombos)
      );

      const uniqueDishCombos = [];
      const usedDishes = new Set();

      for (let combo of filtered) {
        const dishSet = combo.dishes;
        if (![...dishSet].some(d => usedDishes.has(d))) {
          uniqueDishCombos.push(combo);
          [...dishSet].forEach(d => usedDishes.add(d));
        }
        if (uniqueDishCombos.length === 3) break;
      }

      if (uniqueDishCombos.length >= 3) {
        validCombos = uniqueDishCombos;
        break;
      }

      attempts++;
    }

    if (validCombos.length < 3) {
      console.warn(`⚠️ Warning: Only ${validCombos.length} combos found for ${day}`);
    }

    usedCombos.push(...validCombos);

    weeklyMenu.push({
      day,
      taste_profile: tasteProfileMap[i],
      combos: validCombos.map(c => ({
        combo_id: c.combo_id,
        main: c.main,
        side: c.side,
        drink: c.drink,
        total_calories: c.total_calories,
        popularity_score: c.popularity_score,
        reasoning: c.reasoning
      }))
    });
  }

  fs.writeFileSync(outputPath, JSON.stringify(weeklyMenu, null, 2));
  console.log("✅ Output written to data/output.json");
}

generateWeeklyMenu().catch(err => {
  console.error("❌ Error generating menu:", err);
});
