/** Keep the initial host boundary narrow until user acceptance establishes a broader range. */
export function supportsHost(system, foundryVersion) {
  const [major, build = 0] = String(foundryVersion).split(".").map(Number);
  return system?.id === "dnd5e" && system.version === "5.3.3" && major === 13 && build >= 347;
}
