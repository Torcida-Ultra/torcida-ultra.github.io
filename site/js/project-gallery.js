(() => {
  const track = document.querySelector("[data-project-gallery]");
  const dialog = document.querySelector("[data-project-dialog]");
  const items = Array.from(document.querySelectorAll("[data-project-item]"));

  if (!track || !dialog || items.length === 0 || typeof dialog.showModal !== "function") {
    return;
  }

  const image = dialog.querySelector("[data-project-image]");
  const caption = dialog.querySelector("[data-project-caption]");
  const counter = dialog.querySelector("[data-project-counter]");
  const thumbnails = dialog.querySelector("[data-project-thumbnails]");
  let activeIndex = 0;

  const select = (index) => {
    activeIndex = (index + items.length) % items.length;
    const item = items[activeIndex];

    image.src = item.dataset.projectSrc;
    image.alt = item.dataset.projectAlt;
    caption.textContent = item.dataset.projectCaption;
    counter.textContent = `${activeIndex + 1} / ${items.length}`;

    thumbnails.querySelectorAll("button").forEach((thumbnail, thumbnailIndex) => {
      const selected = thumbnailIndex === activeIndex;
      thumbnail.setAttribute("aria-current", selected ? "true" : "false");
      if (selected) {
        thumbnail.scrollIntoView({ block: "nearest", inline: "center" });
      }
    });

    for (const adjacentIndex of [activeIndex - 1, activeIndex + 1]) {
      const preload = new Image();
      preload.src = items[(adjacentIndex + items.length) % items.length].dataset.projectSrc;
    }
  };

  items.forEach((item, index) => {
    item.addEventListener("click", () => {
      dialog.showModal();
      select(index);
    });

    const thumbnail = document.createElement("button");
    const thumbnailImage = document.createElement("img");
    thumbnail.type = "button";
    thumbnail.className = "gallery-thumbnail";
    thumbnail.setAttribute("aria-label", `Prikaži fotografiju ${index + 1}`);
    thumbnailImage.src = item.querySelector("img").src;
    thumbnailImage.alt = "";
    thumbnailImage.loading = "lazy";
    thumbnail.append(thumbnailImage);
    thumbnail.addEventListener("click", () => select(index));
    thumbnails.append(thumbnail);
  });

  document.querySelectorAll("[data-project-scroll]").forEach((button) => {
    button.addEventListener("click", () => {
      const direction = Number(button.dataset.projectScroll);
      const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
      track.scrollBy({ left: direction * track.clientWidth * 0.85, behavior });
    });
  });

  dialog.querySelector("[data-project-previous]").addEventListener("click", () => select(activeIndex - 1));
  dialog.querySelector("[data-project-next]").addEventListener("click", () => select(activeIndex + 1));
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      select(activeIndex - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      select(activeIndex + 1);
    }
  });
})();
