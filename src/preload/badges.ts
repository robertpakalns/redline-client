import { createEl } from "../preload/preloadFunctions.js";

const linkedBadge = (linkedTime: string): HTMLElement => {
  const img = createEl("img", {
    src: "redline://local?path=assets/icons/badges/linked.png",
  });

  const span = createEl("span", {}, "redlineBadge", [img]);
  span.setAttribute(
    "data-text",
    `This user linked at ${new Date(linkedTime).toLocaleDateString()}`,
  );

  return span;
};

const addBadges = (cont: HTMLElement, shortId: string): void => {
  if (!cont) return;

  let user = badgesMap.get(shortId);
  if (!user) return;

  const badgesCont = createEl("div", {}, "badgesCont", [
    linkedBadge(user.linked_at),
  ]);

  cont.appendChild(badgesCont);
};

let badgesMap: Map<string, any> = new Map();

export const getBadges = async () => {
  const response = await fetch("https://redline.tricko.pro/get_data");
  const data = await response.json();

  badgesMap = new Map(data.map((u: any) => [u.short_id, u]));
};

export const profileMenuBadge = (cont: HTMLElement): void => {
  if (cont.querySelector(".badgesCont")) return;

  const shortIdCont = cont.querySelector(".v-popover .value")!;
  if (!shortIdCont) return;

  const shortId = shortIdCont.innerHTML.replace("#", "");
  const nameCont = cont.querySelector(".you .nickname") as HTMLElement;

  addBadges(nameCont, shortId);
};

export const mainMenuBadge = (cont: HTMLElement): void => {
  const divs = cont.querySelectorAll("div");

  const shortId = document
    .querySelector("#auth-user .username")
    ?.textContent.split("#")[1];

  for (const el of Array.from(divs)) {
    if (cont.querySelector(".badgesCont")) continue;

    const nameCont = el.querySelector(".nickname") as HTMLElement;
    addBadges(nameCont, shortId!);
  }
};

export const gameTDMBadges = (cont: HTMLElement): void => {
  const leftCont = cont.querySelector(".player-left-cont");
  const rightCont = cont.querySelector(".player-right-cont");
  if (!leftCont || !rightCont) return;

  const allContainers = [leftCont, rightCont];

  for (const container of allContainers) {
    const players = container.querySelectorAll(".player-cont");
    for (const el of Array.from(players)) {
      const shortIdCont = el.querySelector(".short-id") as HTMLElement | null;
      if (!shortIdCont) continue;

      const shortId = shortIdCont.textContent?.replace("#", "");
      const playerLeft = el.querySelector(".player-left") as HTMLElement;
      if (!playerLeft || !shortId) continue;

      const oldBadge = playerLeft.querySelector(".badgesCont") as HTMLElement;
      const user = badgesMap.get(shortId);

      if (user) {
        if (!oldBadge) addBadges(playerLeft, shortId);
      } else {
        if (oldBadge) oldBadge.remove();
      }
    }
  }
};

export const gameDMBadges = (cont: HTMLElement): void => {
  const players = cont.querySelectorAll(".player-cont");

  for (const el of Array.from(players)) {
    const shortIdCont = el.querySelector(".short-id") as HTMLElement | null;
    if (!shortIdCont) continue;

    const shortId = shortIdCont.textContent?.replace("#", "");
    const playerLeft = el.querySelector(".player-left") as HTMLElement;
    if (!playerLeft) continue;

    const oldBadge = playerLeft.querySelector(".badgesCont");
    const user = shortId ? badgesMap.get(shortId) : null;

    if (user) {
      if (!oldBadge) addBadges(playerLeft, shortId);
    } else {
      if (oldBadge) oldBadge.remove();
    }
  }
};

export const escGameBadges = (cont: HTMLElement): void => {
  const players = cont.querySelectorAll(".player-cont");

  for (const el of Array.from(players)) {
    const shortIdEl = el.querySelector(".short-id") as HTMLElement;
    const nicknameEl = el.querySelector(".nickname") as HTMLElement;
    if (!shortIdEl || !nicknameEl) continue;

    const shortId = shortIdEl.textContent?.replace("#", "");
    const oldBadge = nicknameEl.querySelector(".badgesCont");

    const user = shortId ? badgesMap.get(shortId) : null;

    if (user) {
      if (!oldBadge) addBadges(nicknameEl, shortId);
    } else {
      if (oldBadge) oldBadge.remove();
    }
  }
};

export const setFriendBadges = (cont: HTMLElement, c: string): void => {
  const subCont = cont.querySelector(`.${c}`);
  if (!subCont) return;

  const friends = subCont.querySelectorAll(".friend");

  for (const el of Array.from(friends)) {
    if (el.querySelector(".badgesCont")) continue;

    const shortIdCont = el.querySelector(".friend-id") as HTMLElement;
    if (!shortIdCont) continue;

    const shortId = shortIdCont.textContent;
    const nameCont = el.querySelector(".nickname") as HTMLElement;
    if (!nameCont) continue;

    addBadges(nameCont, shortId);
  }
};
