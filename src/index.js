import { $, on, rgbaOffset } from '../dist/helpers.js';
import KernelDitherer from '../dist/kernel-ditherer.js';
import BrailleCodec from './braille-codec.js';

class BraillePainter {
  static #ditherers = {
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

  #brlWidth = 2;
  #brlHeight = 3;
  #unicodeWidth = 32;
  #invert = false;
  #threshold = 127;
  #dithererName = 'floydSteinberg';
  #imageSrc = '';
  #image = undefined;
  unicodeTarget = undefined;
  banacodeTarget = undefined;

  constructor(
    brlHeight = 3,
    unicodeWidth = 32,
    invert = false,
    threshold = 127,
    dithererName = 'floydSteinberg'
  ) {
    this.#brlHeight = brlHeight;
    this.#unicodeWidth = unicodeWidth;
    this.#invert = invert;
    this.#threshold = threshold;
    this.#dithererName = dithererName;

    this.#image = document.createElement('img');
    this.#image.addEventListener('load', () => this.render());
  }

  get brlHeight() {
    return this.#brlHeight;
  }
  set brlHeight(newValue) {
    if (newValue == this.#brlHeight) return;
    this.#brlHeight == newValue;
    this.banacodeTarget.parentElement.style.display =
      this.#brlHeight == 3 ? '' : 'none';
    //this.render();
  }

  set imageSrc(newValue) {
    if (newValue == this.#imageSrc) return;
    this.#imageSrc = newValue;

    // if (this.#image) this.#image.remove();
    // this.#image = document.createElement('img');
    this.#image.src = URL.createObjectURL(this.#imageSrc);
    /* await new Promise((resolve) => on(this.#image, 'load', resolve)).then((resolve) =>
      this.render()
    ); */
  }

  set dither(newValue) {
    if (!(newValue in BraillePainter.#ditherers)) return;
    if (newValue == this.#dithererName) return;
    this.#dithererName = newValue;
    //this.render();
  }

  set threshold(newValue) {
    if (newValue == this.#threshold) return;
    this.#threshold = newValue;
    //this.render();
  }

  get unicodeWidth() {
    return this.#unicodeWidth;
  }
  set unicodeWidth(newValue) {
    if (newValue == this.#unicodeWidth || newValue < 1) return;
    this.#unicodeWidth = newValue;
    //this.render();
  }

  set invert(newValue) {
    if (newValue == this.#invert) return;
    this.#invert = newValue;
    //this.render();
  }

  render() {
    this.unicodeTarget.innerHtml = '';
    this.banacodeTarget.innerHtml = '';
    this.unicodeTarget.insertAdjacentHTML('afterbegin', this.unicodeHtml);
    this.banacodeTarget.insertAdjacentHTML('afterbegin', this.banacodeHtml);
  }

  get unicodeHeight() {
    // image w:h = code ww:hh
    // code h = ih/iw * cww/h
    return Math.ceil(
      (this.#image.height /
        this.#brlHeight /
        (this.#image.width / this.#brlWidth)) *
        this.#unicodeWidth
    );
  }

  #unicodeLines() {
    if (!this.#imageSrc) return;

    let unicodeText = [];

    let canvas = document.createElement('canvas');
    let context = canvas.getContext('2d');

    canvas.width = this.unicodeWidth * this.#brlWidth;
    canvas.height = this.unicodeHeight * this.#brlHeight;

    // canvas with white
    context.globalCompositeOperation = 'source-over';
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Draw the image as greyscale
    context.globalCompositeOperation = 'luminosity';
    context.drawImage(this.#image, 0, 0, canvas.width, canvas.height);
    const greyPixels = context.getImageData(0, 0, canvas.width, canvas.height);

    const ditherer = BraillePainter.#ditherers[this.#dithererName];
    const ditheredPixels = ditherer.dither(greyPixels, this.#threshold);
    const targetValue = this.#invert ? 255 : 0;

    for (let y = 0; y < canvas.height; y += this.#brlHeight) {
      const line = [];
      for (let x = 0; x < canvas.width; x += this.#brlWidth) {
        // Braille Unicode range starts at U2800 (= 10240 decimal)
        // Each of the eight dots is mapped to a bit in a byte which
        // determines its position in the range.
        // https://en.wikipedia.org/wiki/Braille_Patterns
        line.push(
          0x2800 +
            (this.#brlHeight == 8
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
    }

    canvas.remove();
    return unicodeText;
  }

  get unicodeText() {
    return this.#unicodeLines().join('\n');
  }

  get unicodeHtml() {
    return this.#unicodeLines()
      .map((lineChars) =>
        lineChars
          .split('')
          .map((char) => `<span>${char}</span>`)
          .join('')
      )
      .join('<br/>');
  }

  get #banacodeLines() {
    const parser = new DOMParser();
    let result = this.#unicodeLines().map(
      (lineChars) =>
        parser.parseFromString(
          BrailleCodec.unicodeToBana(lineChars),
          'text/html'
        ).documentElement.innerText
    );
    return result;
  }

  get banacodeText() {
    let result = this.#banacodeLines.join('\n');
    return result;
  }

  get banacodeHtml() {
    let result = this.#banacodeLines
      /* .map(
        (lineChars) =>
          lineChars
           .split('')
           .map((char) => `<span>${char}</span>`)
           .join('')
      ) */
      .join('<br/>');
    return result;
  }

  get charCount() {
    return this.unicodeText.length.toLocaleString();
  }
}

export default BraillePainter;
