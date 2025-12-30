/**
 * Converts a PropertyType enum value to its numeric ID (as in backend).
 * Returns undefined if the value is not a valid PropertyType.
 */
import { PropertyType } from "@/types/models";
export function propertyTypeToId(type: PropertyType): number | undefined {
  switch (type) {
    case PropertyType.House:
      return 1;
    case PropertyType.Apartment:
      return 2;
    case PropertyType.Land:
      return 3;
    case PropertyType.Building:
      return 4;
    case PropertyType.Unit:
      return 5;
    default:
      return undefined;
  }
}
/**
 * Converts a PropertyType enum value to its canonical string representation.
 * Returns undefined if the value is not a valid PropertyType.
 */
export function propertyTypeToString(type: PropertyType): string | undefined {
  switch (type) {
    case PropertyType.House:
      return "house";
    case PropertyType.Apartment:
      return "apartment";
    case PropertyType.Land:
      return "land";
    case PropertyType.Building:
      return "building";
    case PropertyType.Unit:
      return "unit";
    default:
      return undefined;
  }
}

/**
 * Converts a string to a PropertyType enum value.
 * Returns undefined if the string does not match any PropertyType.
 */
export function propertyTypeFromString(str: string): PropertyType | undefined {
  if (!str) return undefined;
  const normalized = str.trim().toLowerCase();
  switch (normalized) {
    case "house":
    case "moradia":
    case "1":
      return PropertyType.House;
    case "apartment":
    case "apartamento":
    case "2":
      return PropertyType.Apartment;
    case "land":
    case "terreno":
    case "3":
      return PropertyType.Land;
    case "building":
    case "prédio":
    case "predio":
    case "4":
      return PropertyType.Building;
    case "unit":
    case "fração":
    case "fracao":
    case "5":
      return PropertyType.Unit;
    default:
      return undefined;
  }
}
