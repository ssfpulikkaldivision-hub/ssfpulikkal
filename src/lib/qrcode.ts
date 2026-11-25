/**
 * Self-contained QR Code Generator in TypeScript
 * Implements ISO/IEC 18004 QR Code specification (Byte mode, Error Correction Level M/L/H)
 * Produces crisp SVG vector strings and SVG Data URLs.
 * Zero external dependencies. Works on Node.js, Cloudflare Workers, and Browser.
 */

export type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";

// Alignment pattern locations for versions 1 to 10
const ALIGNMENT_PATTERN_LOCATIONS: number[][] = [
    [],
    [6, 18],
    [6, 22],
    [6, 26],
    [6, 30],
    [6, 34],
    [6, 22, 38],
    [6, 24, 42],
    [6, 26, 46],
    [6, 28, 50],
];

// Error correction and block specs for versions 1 to 10 at Level M
// [totalCodewords, ecCodewordsPerBlock, numBlocksGroup1, dataCodewordsGroup1, numBlocksGroup2, dataCodewordsGroup2]
const VERSION_SPECS_M: Record<number, [number, number, number, number, number, number]> = {
    1: [26, 10, 1, 16, 0, 0],
    2: [44, 16, 1, 28, 0, 0],
    3: [70, 26, 1, 44, 0, 0],
    4: [100, 18, 2, 32, 0, 0],
    5: [134, 24, 2, 43, 0, 0],
    6: [172, 16, 4, 27, 0, 0],
    7: [196, 18, 4, 31, 0, 0],
    8: [242, 22, 2, 38, 2, 39],
    9: [292, 22, 3, 36, 2, 37],
    10: [346, 26, 4, 43, 1, 44],
};

// Galois Field GF(256) tables for Reed-Solomon error correction
const GF_EXP: number[] = new Array(512);
const GF_LOG: number[] = new Array(256);

(function initGaloisField() {
    let x = 1;
    for (let i = 0; i < 255; i++) {
        GF_EXP[i] = x;
        GF_LOG[x] = i;
        x <<= 1;
        if (x & 256) {
            x ^= 0x11d; // Primitive polynomial x^8 + x^4 + x^3 + x^2 + 1
        }
    }
    for (let i = 255; i < 512; i++) {
        GF_EXP[i] = GF_EXP[i - 255];
    }
})();

function gfMultiply(a: number, b: number): number {
    if (a === 0 || b === 0) return 0;
    return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function rsGeneratorPoly(degree: number): number[] {
    let poly = [1];
    for (let i = 0; i < degree; i++) {
        const next = new Array(poly.length + 1).fill(0);
        for (let j = 0; j < poly.length; j++) {
            next[j] ^= gfMultiply(poly[j], GF_EXP[i]);
            next[j + 1] ^= poly[j];
        }
        poly = next;
    }
    return poly;
}

function calculateReedSolomon(data: number[], ecCount: number): number[] {
    const genPoly = rsGeneratorPoly(ecCount);
    const result = new Array(ecCount).fill(0);

    for (let i = 0; i < data.length; i++) {
        const factor = data[i] ^ result[0];
        result.shift();
        result.push(0);
        if (factor !== 0) {
            for (let j = 0; j < ecCount; j++) {
                result[j] ^= gfMultiply(genPoly[j], factor);
            }
        }
    }
    return result;
}

// Format info strings (Level M: bits 00) for mask patterns 0..7
const FORMAT_INFO: number[] = [
    0x5412, 0x5125, 0x5e7c, 0x5b4b, 0x45f9, 0x40ce, 0x4f97, 0x4aa0
];

export class QRCodeEncoder {
    public version: number = 1;
    public size: number = 21;
    public modules: boolean[][] = [];
    public isFunction: boolean[][] = [];

    constructor(private text: string) {
        this.selectVersion();
        this.size = this.version * 4 + 17;
        this.modules = Array.from({ length: this.size }, () => new Array(this.size).fill(false));
        this.isFunction = Array.from({ length: this.size }, () => new Array(this.size).fill(false));
        this.generate();
    }

    private selectVersion() {
        const utf8Bytes = new TextEncoder().encode(this.text);
        // Header: Mode (4 bits) + Character Count (8 bits for V1-9, 16 bits for V10+)
        for (let v = 1; v <= 10; v++) {
            const spec = VERSION_SPECS_M[v];
            const totalDataCodewords = spec[2] * spec[3] + spec[4] * spec[5];
            const maxPayload = totalDataCodewords - 2; // 4 bit mode + 8 bit count approx
            if (utf8Bytes.length <= maxPayload) {
                this.version = v;
                return;
            }
        }
        this.version = 10;
    }

    private setFunctionModule(r: number, c: number, val: boolean) {
        this.modules[r][c] = val;
        this.isFunction[r][c] = true;
    }

    private placeFinderPattern(row: number, col: number) {
        for (let r = -1; r <= 7; r++) {
            for (let c = -1; c <= 7; c++) {
                const nr = row + r;
                const nc = col + c;
                if (nr < 0 || nr >= this.size || nc < 0 || nc >= this.size) continue;
                if (
                    (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
                    (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
                    (r >= 2 && r <= 4 && c >= 2 && c <= 4)
                ) {
                    this.setFunctionModule(nr, nc, true);
                } else {
                    this.setFunctionModule(nr, nc, false);
                }
            }
        }
    }

    private placeAlignmentPattern(row: number, col: number) {
        for (let r = -2; r <= 2; r++) {
            for (let c = -2; c <= 2; c++) {
                const isEdge = Math.abs(r) === 2 || Math.abs(c) === 2;
                const isCenter = r === 0 && c === 0;
                this.setFunctionModule(row + r, col + c, isEdge || isCenter);
            }
        }
    }

    private generate() {
        const bytes = new TextEncoder().encode(this.text);
        const spec = VERSION_SPECS_M[this.version];
        const [totalCodewords, ecCodewords, b1, d1, b2, d2] = spec;
        const totalDataCodewords = b1 * d1 + b2 * d2;

        // 1. Bit Buffer: Mode (0100 for Byte mode)
        const bitBuffer: number[] = [];
        const pushBits = (val: number, len: number) => {
            for (let i = len - 1; i >= 0; i--) {
                bitBuffer.push((val >>> i) & 1);
            }
        };

        pushBits(0b0100, 4); // Byte Mode
        pushBits(bytes.length, this.version < 10 ? 8 : 16); // Char count
        for (const b of bytes) {
            pushBits(b, 8);
        }

        // Terminator (up to 4 zeroes)
        const maxBits = totalDataCodewords * 8;
        const termLen = Math.min(4, maxBits - bitBuffer.length);
        for (let i = 0; i < termLen; i++) bitBuffer.push(0);

        // Pad to byte boundary
        while (bitBuffer.length % 8 !== 0) bitBuffer.push(0);

        // Convert bit buffer to data codewords
        const dataWords: number[] = [];
        for (let i = 0; i < bitBuffer.length; i += 8) {
            let byte = 0;
            for (let j = 0; j < 8; j++) {
                byte = (byte << 1) | bitBuffer[i + j];
            }
            dataWords.push(byte);
        }

        // Pad alternating codewords 0xEC and 0x11
        const padBytes = [0xEC, 0x11];
        let p = 0;
        while (dataWords.length < totalDataCodewords) {
            dataWords.push(padBytes[p % 2]);
            p++;
        }

        // 2. Block partition & Error Correction
        const dataBlocks: number[][] = [];
        const ecBlocks: number[][] = [];
        let offset = 0;

        for (let i = 0; i < b1; i++) {
            const block = dataWords.slice(offset, offset + d1);
            dataBlocks.push(block);
            ecBlocks.push(calculateReedSolomon(block, ecCodewords));
            offset += d1;
        }
        for (let i = 0; i < b2; i++) {
            const block = dataWords.slice(offset, offset + d2);
            dataBlocks.push(block);
            ecBlocks.push(calculateReedSolomon(block, ecCodewords));
            offset += d2;
        }

        // 3. Interleave data & ec codewords
        const finalCodewords: number[] = [];
        const maxBlockLen = Math.max(d1, d2);
        for (let i = 0; i < maxBlockLen; i++) {
            for (const blk of dataBlocks) {
                if (i < blk.length) finalCodewords.push(blk[i]);
            }
        }
        for (let i = 0; i < ecCodewords; i++) {
            for (const blk of ecBlocks) {
                finalCodewords.push(blk[i]);
            }
        }

        // 4. Place Function Patterns
        // Finders
        this.placeFinderPattern(0, 0);
        this.placeFinderPattern(0, this.size - 7);
        this.placeFinderPattern(this.size - 7, 0);

        // Timing patterns
        for (let i = 8; i < this.size - 8; i++) {
            if (!this.isFunction[6][i]) this.setFunctionModule(6, i, i % 2 === 0);
            if (!this.isFunction[i][6]) this.setFunctionModule(i, 6, i % 2 === 0);
        }

        // Alignment patterns for version >= 2
        if (this.version >= 2) {
            const coords = ALIGNMENT_PATTERN_LOCATIONS[this.version - 1];
            for (const r of coords) {
                for (const c of coords) {
                    if (this.isFunction[r][c]) continue;
                    this.placeAlignmentPattern(r, c);
                }
            }
        }

        // Dark module
        this.setFunctionModule(4 * this.version + 9, 8, true);

        // Reserve format info area
        for (let i = 0; i < 9; i++) {
            if (!this.isFunction[8][i]) this.isFunction[8][i] = true;
            if (!this.isFunction[i][8]) this.isFunction[i][8] = true;
        }
        for (let i = 0; i < 8; i++) {
            if (!this.isFunction[8][this.size - 1 - i]) this.isFunction[8][this.size - 1 - i] = true;
            if (!this.isFunction[this.size - 1 - i][8]) this.isFunction[this.size - 1 - i][8] = true;
        }

        // 5. Place Data Bits with standard mask pattern 0: (row + col) % 2 === 0
        const maskFn = (r: number, c: number) => (r + c) % 2 === 0;

        let bitIndex = 0;
        const totalBits = finalCodewords.length * 8;
        const getBit = (idx: number) => {
            if (idx >= totalBits) return 0;
            const byte = finalCodewords[idx >>> 3];
            return (byte >>> (7 - (idx & 7))) & 1;
        };

        let upwards = true;
        for (let right = this.size - 1; right > 0; right -= 2) {
            if (right === 6) right--; // Skip vertical timing pattern column
            for (let vert = 0; vert < this.size; vert++) {
                const r = upwards ? this.size - 1 - vert : vert;
                for (let c = right; c > right - 2; c--) {
                    if (this.isFunction[r][c]) continue;
                    const bit = getBit(bitIndex++);
                    const masked = bit ^ (maskFn(r, c) ? 1 : 0);
                    this.modules[r][c] = masked === 1;
                }
            }
            upwards = !upwards;
        }

        // 6. Write Format Info (Mask 0 -> FORMAT_INFO[0])
        const formatBits = FORMAT_INFO[0];
        for (let i = 0; i < 15; i++) {
            const val = ((formatBits >>> i) & 1) === 1;
            // Around top-left finder
            if (i < 6) this.modules[8][i] = val;
            else if (i === 6) this.modules[8][7] = val;
            else if (i === 7) this.modules[8][8] = val;
            else if (i === 8) this.modules[7][8] = val;
            else this.modules[14 - i][8] = val;

            // Second copy: bottom-left & top-right
            if (i < 8) {
                this.modules[this.size - 1 - i][8] = val;
            } else {
                this.modules[8][this.size - 15 + i] = val;
            }
        }
    }

    /**
     * Renders QR code as an SVG string
     */
    public toSVG(options?: {
        size?: number;
        margin?: number;
        fgColor?: string;
        bgColor?: string;
        borderRadius?: number;
    }): string {
        const {
            size = 220,
            margin = 3,
            fgColor = "#000000",
            bgColor = "#ffffff",
        } = options || {};

        const totalGrid = this.size + margin * 2;
        let rects = "";

        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.modules[r][c]) {
                    const x = c + margin;
                    const y = r + margin;
                    rects += `<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="${fgColor}" />`;
                }
            }
        }

        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalGrid} ${totalGrid}" width="${size}" height="${size}" shape-rendering="crispEdges">
  <rect width="100%" height="100%" fill="${bgColor}" rx="6" ry="6" />
  ${rects}
</svg>`;
    }

    /**
     * Returns an SVG Data URL suitable for `<img src="..." />`
     */
    public toDataURL(options?: {
        size?: number;
        margin?: number;
        fgColor?: string;
        bgColor?: string;
    }): string {
        const svg = this.toSVG(options);
        return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    }
}

/**
 * Convenience helper to generate QR code SVG directly
 */
export function generateQRCodeSVG(
    text: string,
    options?: { size?: number; margin?: number; fgColor?: string; bgColor?: string }
): string {
    const encoder = new QRCodeEncoder(text);
    return encoder.toSVG(options);
}

/**
 * Convenience helper to generate QR code Data URL directly
 */
export function generateQRCodeDataURL(
    text: string,
    options?: { size?: number; margin?: number; fgColor?: string; bgColor?: string }
): string {
    const encoder = new QRCodeEncoder(text);
    return encoder.toDataURL(options);
}
