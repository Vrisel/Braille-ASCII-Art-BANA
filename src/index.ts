import { $, on, rgbaOffset } from './helpers.js';
import KernelDitherer from './kernel-ditherer.js';
import BrailleCodec from './braille-codec.js';
// Braille symbol is 2x4 dots
const brlWidth = 2;
let brlHeight = 3;

type DithererName = 'threshold' | 'floydSteinberg' | 'stucki' | 'atkinson';

const ditherers: Record<DithererName, Ditherer> = {
  threshold: new KernelDitherer([0, 0], [], 1),
  floydSteinberg: new KernelDitherer(
    [1, 0],
    [
      [0, 0, 7],
      [3, 5, 1],
    ],
    16
  ),
  stucki: new KernelDitherer(
    [2, 0],
    [
      [0, 0, 0, 8, 4],
      [2, 4, 8, 4, 2],
      [1, 2, 4, 2, 1],
    ],
    42
  ),
  atkinson: new KernelDitherer(
    [1, 0],
    [
      [0, 0, 1, 1],
      [1, 1, 1, 0],
      [0, 1, 0, 0],
    ],
    8
  ),
};

let dithererName: DithererName = 'floydSteinberg',
  invert = false,
  threshold = 127,
  unicodeWidth = 32,
  unicodeHeight = 100;

let image: HTMLImageElement;
let canvas = document.createElement('canvas');
let context = canvas.getContext('2d')!;
let unicode = '';
let banacode = '';

on(document, 'DOMContentLoaded', function (e) {
  on($<HTMLInputElement>('#filepicker'), 'change', async function () {
    if (!this.files || !this.files.length) return;

    image = document.createElement('img');
    image.src = URL.createObjectURL(this.files[0].slice(0));
    await new Promise((resolve) => on(image, 'load', resolve));

    render();
  });

  on($<HTMLSelectElement>('#brltype'), 'change', function () {
    let newValue = parseInt(this.value)/2;
    if (newValue == brlHeight) return;
    brlHeight == newValue;
    render();
  });

  on($<HTMLSelectElement>('#dither'), 'change', function () {
    let newValue = this.value as DithererName;
    if (newValue == dithererName) return;
    dithererName = newValue;
    render();
  });

  on($<HTMLInputElement>('#threshold'), 'change', function () {
    let newValue = parseInt(this.value);
    if (newValue == threshold) return;
    threshold = newValue;
    render();
  });

  on($<HTMLInputElement>('#width'), 'input', function () {
    let newValue = parseInt(this.value);
    if (newValue == unicodeWidth || newValue < 1) return;
    unicodeWidth = newValue;
    render();
  });

  on($<HTMLInputElement>('#invert'), 'change', function () {
    invert = this.checked;
    document.body.classList.toggle('invert', invert);
    render();
  });

  on($<HTMLInputElement>('#font-size'), 'input', function () {
    document.documentElement.style.setProperty(
      '--font-size',
      `${this.value}px`
    );
  });
});

async function render() {
  brlHeight =
    parseInt(document.querySelector('#brltype')?.nodeValue ?? '6') / 2;
  let unicodeText: string[] = [];
  let unicodeHtml: string[] = [];
  let banaText: string[] = [];
  let banaHtml: string[] = [];

  if (!image) return;

  unicodeHeight = Math.ceil(
    (unicodeWidth * brlWidth * (image.height / image.width)) / brlHeight
  );
  document.documentElement.style.setProperty(
    '--width',
    unicodeWidth.toString()
  );
  document.documentElement.style.setProperty(
    '--height',
    unicodeHeight.toString()
  );

  canvas.width = unicodeWidth * brlWidth;
  canvas.height = unicodeHeight * brlHeight;

  // Fill the canvas with white
  context.globalCompositeOperation = 'source-over';
  context.fillStyle = 'white';
  context.fillRect(0, 0, canvas.width, canvas.height);

  // Draw the image as greyscale
  context.globalCompositeOperation = 'luminosity';
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const ditherer = ditherers[dithererName];

  const greyPixels = context.getImageData(0, 0, canvas.width, canvas.height);
  const ditheredPixels = ditherer.dither(greyPixels, threshold);
  const targetValue = invert ? 255 : 0;

  for (let y = 0; y < canvas.height; y += brlHeight) {
    const line: number[] = [];
    for (let x = 0; x < canvas.width; x += brlWidth) {
      // Braille Unicode range starts at U2800 (= 10240 decimal)
      // Each of the eight dots is mapped to a bit in a byte which
      // determines its position in the range.
      // https://en.wikipedia.org/wiki/Braille_Patterns
      line.push(
        0x2800 +
          (brlHeight == 8
            ? (+(
                ditheredPixels.data.at(
                  rgbaOffset(x + 1, y + 3, canvas.width)
                ) === targetValue
              ) <<
                7) +
              (+(
                ditheredPixels.data.at(
                  rgbaOffset(x + 0, y + 3, canvas.width)
                ) === targetValue
              ) <<
                6)
            : 0) +
          (+(
            ditheredPixels.data.at(rgbaOffset(x + 1, y + 2, canvas.width)) ===
            targetValue
          ) <<
            5) +
          (+(
            ditheredPixels.data.at(rgbaOffset(x + 1, y + 1, canvas.width)) ===
            targetValue
          ) <<
            4) +
          (+(
            ditheredPixels.data.at(rgbaOffset(x + 1, y + 0, canvas.width)) ===
            targetValue
          ) <<
            3) +
          (+(
            ditheredPixels.data.at(rgbaOffset(x + 0, y + 2, canvas.width)) ===
            targetValue
          ) <<
            2) +
          (+(
            ditheredPixels.data.at(rgbaOffset(x + 0, y + 1, canvas.width)) ===
            targetValue
          ) <<
            1) +
          (+(
            ditheredPixels.data.at(rgbaOffset(x + 0, y + 0, canvas.width)) ===
            targetValue
          ) <<
            0)
      );
    }
    const lineChars = String.fromCharCode.apply(String, line);
    unicodeText.push(lineChars);
    banaText.push(BrailleCodec.unicodeToBana(lineChars));
    unicodeHtml.push(
      lineChars
        .split('')
        .map((char) => `<span>${char}</span>`)
        .join('')
    );
    banaHtml.push(
      BrailleCodec.unicodeToBana(lineChars)
      /* .split('')
        .map((char) => `<span>${char}</span>`)
        .join('') */
    );
  }

  unicode = unicodeText.join('\n');
  banacode = new DOMParser()
    .parseFromString(banaText.join('\n'), 'text/html')
    .documentElement.innerText;

  $('#char-count')!.textContent = unicode.length.toLocaleString();

  let output = $('#output')!;
  //output.style.display = 'block';
  output.innerHTML = '';
  output.insertAdjacentHTML('afterbegin', unicodeHtml.join('<br/>'));
  let output2 = $('#output2')!;
  //output2.style.display = 'block';
  output2.innerHTML = '';
  output2.insertAdjacentHTML('afterbegin', banaHtml.join('<br/>'));
  $('#bana')!.style.display = brlHeight != 3 ? 'none' : '';
}
