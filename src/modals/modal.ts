import { createEl } from "../preload/preloadFunctions";

class Modal {
  cont: HTMLElement;

  constructor(html: string, id: string) {
    this.cont = createEl("div", { innerHTML: html }, "modalWrapper");
    this.cont.id = id;
    document.body.appendChild(this.cont);

    const close = createEl("div", {}, "close", ["×"]);
    const overlay = createEl("div", {}, "overlay");

    this.cont.prepend(overlay);
    this.cont.querySelector(".modal")?.prepend(close);

    const toggle = () => this.cont.classList.toggle("open");
    close.addEventListener("click", toggle);
    overlay.addEventListener("click", toggle);
  }
}

export default Modal;
