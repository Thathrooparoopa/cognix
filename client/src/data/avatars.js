export const avatars = [
  {
    id: "explorer",
    name: "Explorer",
    description: "Curious, brave and ready for the next quest.",
  },
  {
    id: "inventor",
    name: "Inventor",
    description: "Loves building, experimenting and solving problems.",
  },
  {
    id: "gamer",
    name: "Gamer",
    description: "Turns every challenge into a mission.",
  },
  {
    id: "artist",
    name: "Artist",
    description: "Creative, expressive and always thinking differently.",
  },
  {
    id: "scientist",
    name: "Scientist",
    description: "Questions everything and discovers how things work.",
  },
];

const STORAGE_KEY = "cognix_avatar";

export function getStoredAvatar() {
  return localStorage.getItem(STORAGE_KEY) || null;
}

export function saveAvatar(avatarId) {
  const exists = avatars.some((avatar) => avatar.id === avatarId);

  if (!exists) {
    throw new Error(`Unknown Cognix avatar: ${avatarId}`);
  }

  localStorage.setItem(STORAGE_KEY, avatarId);
  return avatarId;
}
