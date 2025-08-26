import { createEl } from "../utils/functions.js";

const linkedBadge = (): HTMLElement =>
  createEl(
    "img",
    { src: "redline://?path=assets/icons/badges/linked.png" },
    "redlineBadge",
  );

const addBadges = (cont: HTMLElement, shortId: string): void => {
  if (!cont) return;

  let user = badgesMap.get(shortId);
  if (!user) return;

  cont.appendChild(linkedBadge());
};

let badgesMap: Map<string, any> = new Map();

export const getBadges = async () => {
  const response = await fetch("https://redline.tricko.pro/get_data");
  const data = await response.json();

  badgesMap = new Map(data.map((u: any) => [u.short_id, u]));
};

let userCache: Object = {};
let shortIdCache: string = "";
export const getUser = async () => {
  userCache = await fetch(`https://api.kirka.io/api/user`, {
    headers: {
      // The client only uses the token to fetch the account
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  }).then((r) => r.json());

  shortIdCache = (userCache as any).shortId;
};

export const profileMenuBadge = (cont: HTMLElement): void => {
  if (cont.querySelector(".redlineBadge")) return;

  const shortIdCont = cont.querySelector(".v-popover .value")!;
  if (!shortIdCont) return;

  const shortId = shortIdCont.innerHTML.replace("#", "");
  const nameCont = cont.querySelector(".you .nickname") as HTMLElement;

  addBadges(nameCont, shortId);
};

export const mainMenuBadge = (cont: HTMLElement): void => {
  const divs = cont.querySelectorAll("div");

  for (const el of Array.from(divs)) {
    if (cont.querySelector(".redlineBadge")) continue;

    const nameCont = el.querySelector(".nickname") as HTMLElement;
    addBadges(nameCont, shortIdCache);
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
      if (!playerLeft) continue;

      const oldBadge = playerLeft.querySelector(".redlineBadge");
      const user = shortId ? badgesMap.get(shortId) : null;

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

    const oldBadge = playerLeft.querySelector(".redlineBadge");
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
    const oldBadge = nicknameEl.querySelector(".redlineBadge");

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
    if (el.querySelector(".redlineBadge")) continue;

    const shortIdCont = el.querySelector(".friend-id") as HTMLElement;
    if (!shortIdCont) continue;

    const shortId = shortIdCont.textContent;
    const nameCont = el.querySelector(".nickname") as HTMLElement;
    if (!nameCont) continue;

    addBadges(nameCont, shortId);
  }
};
