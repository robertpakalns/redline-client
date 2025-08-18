import { createEl } from "../utils/functions.js";

const linkedBadge = () =>
  createEl(
    "img",
    { src: "redline://?path=assets/icons/badges/linked.png" },
    "redlineBadge",
  );

let badgesCache: Object[] = [];
export const getBadges = async () => {
  badgesCache = await fetch("https://redline.tricko.pro/get_data").then((r) =>
    r.json(),
  );
};

let userCache: Object = {};
let shortIdCache: String = "";
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
  const user = badgesCache.find((el: any) => el.short_id === shortId);
  if (!user) return;

  const nameCont = cont.querySelector(".you .nickname")!;
  if (!nameCont) return;

  nameCont.appendChild(linkedBadge());
};

export const mainMenuBadge = (cont: HTMLElement): void => {
  cont.querySelectorAll("div")?.forEach((el: HTMLElement) => {
    if (cont.querySelector(".redlineBadge")) return;

    const user = badgesCache.find((el: any) => el.short_id === shortIdCache);
    if (!user) return;

    el.querySelector(".nickname")!.appendChild(linkedBadge());
  });
};

export const gameTDMBadges = (cont: HTMLElement): void => {
  const leftCont = cont.querySelector(".player-left-cont");
  const rightCont = cont.querySelector(".player-right-cont");
  if (!leftCont || !rightCont) return;

  const allContainers = [leftCont, rightCont];

  allContainers.forEach((cont) =>
    cont.querySelectorAll(".player-cont").forEach((el: any) => {
      const shortIdCont = el.querySelector(".short-id");
      const playerLeft = el.querySelector(".player-left");
      if (!playerLeft) return;

      const oldBadge = playerLeft.querySelector(".redlineBadge");

      if (!shortIdCont) {
        if (oldBadge) oldBadge.remove();
        return;
      }

      const shortId = shortIdCont.textContent?.replace("#", "");
      if (!shortId) {
        if (oldBadge) oldBadge.remove();
        return;
      }

      const user = badgesCache.find((u: any) => u.short_id === shortId);

      if (!user) {
        if (oldBadge) oldBadge.remove();
        return;
      }

      if (!oldBadge) playerLeft.appendChild(linkedBadge());
    }),
  );
};

export const gameDMBadges = (cont: HTMLElement): void => {
  cont.querySelectorAll(".player-cont").forEach((el: any) => {
    const shortIdCont = el.querySelector(".short-id");
    const playerLeft = el.querySelector(".player-left");
    if (!playerLeft) return;

    const oldBadge = playerLeft.querySelector(".redlineBadge");

    if (!shortIdCont) {
      if (oldBadge) oldBadge.remove();
      return;
    }

    const shortId = shortIdCont.textContent?.replace("#", "");
    if (!shortId) {
      if (oldBadge) oldBadge.remove();
      return;
    }

    const user = badgesCache.find((u: any) => u.short_id === shortId);

    if (!user) {
      if (oldBadge) oldBadge.remove();
      return;
    }

    if (!oldBadge) playerLeft.appendChild(linkedBadge());
  });
};

export const escGameBadges = (cont: HTMLElement): void => {
  const playerCont = cont.querySelectorAll(".player-cont");
  if (!playerCont) return;

  playerCont.forEach((el: any) => {
    const shortIdEl = el.querySelector(".short-id") as HTMLElement;
    const nicknameEl = el.querySelector(".nickname") as HTMLElement;
    const existingBadge = el.querySelector(".redlineBadge");

    if (!shortIdEl || !nicknameEl) {
      if (existingBadge) existingBadge.remove();
      return;
    }

    const shortId = shortIdEl.textContent?.replace("#", "");
    if (!shortId) {
      if (existingBadge) existingBadge.remove();
      return;
    }

    const user = badgesCache.find((u: any) => u.short_id === shortId);
    if (!user) {
      if (existingBadge) existingBadge.remove();
      return;
    }

    if (!existingBadge) nicknameEl.appendChild(linkedBadge());
  });
};

export const incomingFriendsBadges = (cont: HTMLElement, c: String): void => {
  const subCont = cont.querySelector(`.${c}`);
  if (!subCont) return;

  subCont.querySelectorAll(".friend").forEach((el: any) => {
    if (el.querySelector(".redlineBadge")) return;

    const shortIdCont = el.querySelector(".friend-id");
    if (!shortIdCont) return;

    const shortId = shortIdCont.textContent;
    const user = badgesCache.find((u: any) => u.short_id === shortId);
    if (!user) return;

    el.querySelector(".nickname")!.appendChild(linkedBadge());
  });
};
