import brand from "../../assets/images/brand.webp";

export async function downloadTicket(code: string) {
  const logo = new Image();
  logo.src = brand.src;

  // Load the canvas font weights even if the page did not use them yet.
  await Promise.all([
    logo.decode(),
    document.fonts.load("400 26px Inter"),
    document.fonts.load("600 24px Inter"),
    document.fonts.load("700 56px Inter"),
    document.fonts.load("800 88px Inter"),
  ]);

  const canvas = document.createElement("canvas");
  canvas.width = 960;
  canvas.height = 690;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable");

  context.fillStyle = "#fff";
  context.fillRect(0, 0, 960, 690);
  context.fillStyle = "#300843";
  context.fillRect(0, 0, 960, 160);
  const logoHeight = (200 * logo.naturalHeight) / logo.naturalWidth;
  context.drawImage(logo, 380, (160 - logoHeight) / 2, 200, logoHeight);

  context.textAlign = "center";
  context.fillStyle = "#350844";
  context.font = "700 56px Inter";
  context.fillText("You are registered!", 480, 270);
  context.font = "600 24px Inter";
  context.fillText("YOUR REGISTRATION REFERENCE", 480, 380);
  context.font = "800 88px Inter";
  context.fillText(code, 480, 495, 860);
  context.font = "400 26px Inter";
  context.fillText("BIDA Hong Kong · 06 December 2026", 480, 590);
  context.fillText("Booth activities · Registration confirmation", 480, 635);

  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = `${code}.png`;
  document.body.append(link);
  link.click();
  link.remove();
}
