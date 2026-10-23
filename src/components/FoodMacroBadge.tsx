import React from 'react';
import { Flame, Dumbbell, Wheat, Droplets } from 'lucide-react';
import { calculateFoodMacros, FoodMacros } from '../lib/nutritionCalculator.ts';

interface FoodMacroBadgeProps {
  dishName?: string;
  portionGrams?: number;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  compact?: boolean;
  showBreakdownBar?: boolean;
}

export const FoodMacroBadge: React.FC<FoodMacroBadgeProps> = ({
  dishName,
  portionGrams,
  calories,
  protein,
  carbs,
  fat,
  compact = false,
  showBreakdownBar = false,
}) => {
  // If specific dish name is passed, calculate using predefined values per 100g if needed
  const macros: FoodMacros = dishName
    ? calculateFoodMacros(dishName, portionGrams, { calories, protein, carbs, fat })
    : {
        name: 'Dish',
        portionGrams: portionGrams || 180,
        calories: calories ?? 240,
        protein: protein ?? 8.5,
        carbs: carbs ?? 32.0,
        fat: fat ?? 7.0,
        proteinPercent: 15,
        carbsPercent: 55,
        fatPercent: 30,
        source: 'provided',
      };

  if (compact) {
    return (
      <div className="inline-flex items-center gap-1.5 flex-wrap text-[11px] font-medium">
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200/80 font-bold">
          <Flame className="w-3 h-3 text-amber-600 shrink-0" />
          {macros.calories} kcal
        </span>
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200/70">
          <Dumbbell className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
          {macros.protein}g P
        </span>
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200/70">
          <Wheat className="w-2.5 h-2.5 text-blue-600 shrink-0" />
          {macros.carbs}g C
        </span>
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200/70">
          <Droplets className="w-2.5 h-2.5 text-purple-600 shrink-0" />
          {macros.fat}g F
        </span>
      </div>
    );
  }

  return (
    <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3 text-xs space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-bold text-slate-700 flex items-center gap-1">
          <Flame className="w-3.5 h-3.5 text-amber-600" />
          {macros.calories} kcal
          <span className="text-[10px] text-slate-400 font-normal">({macros.portionGrams}g portion)</span>
        </span>
        <span className="text-[10px] text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
          ICMR/IFCT per 100g
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
        <div className="bg-white p-1.5 rounded-lg border border-slate-200/70">
          <div className="text-[10px] text-slate-500 font-medium">Protein</div>
          <div className="font-extrabold text-emerald-700">{macros.protein}g</div>
        </div>
        <div className="bg-white p-1.5 rounded-lg border border-slate-200/70">
          <div className="text-[10px] text-slate-500 font-medium">Carbs</div>
          <div className="font-extrabold text-blue-700">{macros.carbs}g</div>
        </div>
        <div className="bg-white p-1.5 rounded-lg border border-slate-200/70">
          <div className="text-[10px] text-slate-500 font-medium">Fats</div>
          <div className="font-extrabold text-purple-700">{macros.fat}g</div>
        </div>
      </div>

      {showBreakdownBar && (
        <div className="pt-1">
          <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-slate-200">
            <div style={{ width: `${macros.proteinPercent}%` }} className="bg-emerald-500" title={`Protein ${macros.proteinPercent}%`} />
            <div style={{ width: `${macros.carbsPercent}%` }} className="bg-blue-500" title={`Carbs ${macros.carbsPercent}%`} />
            <div style={{ width: `${macros.fatPercent}%` }} className="bg-purple-500" title={`Fat ${macros.fatPercent}%`} />
          </div>
          <div className="flex justify-between text-[9px] text-slate-400 pt-1">
            <span>P: {macros.proteinPercent}%</span>
            <span>C: {macros.carbsPercent}%</span>
            <span>F: {macros.fatPercent}%</span>
          </div>
        </div>
      )}
    </div>
  );
};
