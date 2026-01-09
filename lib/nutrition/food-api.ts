import axios from "axios";

type RecipeSearchParams = {
  query: string;
  calories?: number;
  protein?: number;
  diet?: string;
  intolerances?: string[];
  cuisine?: string;
  number?: number;
};

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value.trim();
}

export async function searchRecipes(params: RecipeSearchParams) {
  const apiKey = requireEnv("SPOONACULAR_API_KEY");

  const calories = typeof params.calories === "number" ? params.calories : null;
  const protein = typeof params.protein === "number" ? params.protein : null;

  const response = await axios.get(
    "https://api.spoonacular.com/recipes/complexSearch",
    {
      params: {
        apiKey,
        query: params.query,
        minCalories: calories !== null ? calories - 50 : undefined,
        maxCalories: calories !== null ? calories + 50 : undefined,
        minProtein: protein !== null ? protein - 5 : undefined,
        maxProtein: protein !== null ? protein + 5 : undefined,
        diet: params.diet,
        intolerances: params.intolerances?.length
          ? params.intolerances.join(",")
          : undefined,
        cuisine: params.cuisine,
        addRecipeInformation: true,
        fillIngredients: true,
        number: params.number ?? 5,
      },
    }
  );

  const data: unknown = response.data;
  if (!data || typeof data !== "object" || !("results" in data)) {
    throw new Error("Unexpected Spoonacular response");
  }

  return (data as { results?: unknown }).results ?? [];
}

export async function getRecipeNutrition(recipeId: number) {
  const apiKey = requireEnv("SPOONACULAR_API_KEY");
  const response = await axios.get(
    `https://api.spoonacular.com/recipes/${recipeId}/nutritionWidget.json`,
    { params: { apiKey } }
  );
  return response.data as unknown;
}

type AnalyzeRecipeParams = {
  ingredients: string[];
  title?: string;
};

export async function analyzeRecipe(params: AnalyzeRecipeParams) {
  const appId = requireEnv("EDAMAM_APP_ID");
  const appKey = requireEnv("EDAMAM_APP_KEY");

  const response = await axios.post(
    "https://api.edamam.com/api/nutrition-details",
    {
      title: params.title ?? "Custom Recipe",
      ingr: params.ingredients,
    },
    {
      params: {
        app_id: appId,
        app_key: appKey,
      },
    }
  );

  return response.data as unknown;
}

