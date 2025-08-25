import { createEl } from "../utils/functions.js";
import { setFriendBadges } from "./badges.js";

const filterFriends = (cont: HTMLElement, search: string): void => {
  const query = search.toLowerCase().trim();
  const list = cont.querySelector(".list") || cont.querySelector(".requests");
  if (!list) return;

  const friends = Array.from(list.querySelectorAll<HTMLElement>(".friend"));

  friends.forEach((el) => {
    const friendId =
      el.querySelector(".friend-id")?.textContent?.toLowerCase() || "";
    const nickname =
      el.querySelector(".nickname")?.textContent?.toLowerCase() || "";

    el.style.display =
      friendId.includes(query) || nickname.includes(query) ? "" : "none";
  });
};

const searchFriends = (cont: HTMLElement): void => {
  const addFriends = cont.querySelector(".add-friends");
  if (!addFriends) return;

  const input = addFriends.querySelector<HTMLInputElement>(
    ".friendFilter input",
  );
  if (input) return;

  const label = createEl("div", {}, "", ["SEARCH FRIEND"]);

  const newInput = createEl("input", {
    type: "text",
    placeholder: "ENTER ID OR NAME",
  }) as HTMLInputElement;
  newInput.minLength = 4;
  newInput.addEventListener("input", () =>
    filterFriends(cont, newInput!.value),
  );

  const friendCont = createEl("div", {}, "friendFilter", [label, newInput]);
  addFriends.appendChild(friendCont);
};

export const manageFriendsPage = (cont: HTMLElement): void => {
  // Search
  searchFriends(cont);

  // Badges
  setFriendBadges(cont, "requests");
  setFriendBadges(cont, "list");
};
