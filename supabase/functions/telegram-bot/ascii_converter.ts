import { Image, createCanvas } from "https://deno.land/x/canvas@v1.4.1/mod.ts"

interface ASCIISettings {
  width: number;
  contrast: number;
  brightness: number;
  color_mode: string;
}

export class ASCIIArtConverter {
  private readonly ASCII_CHARS = '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,"^`\'. '
  private readonly settings: ASCIISettings
  private readonly fontSize: number = 20

  constructor(settings: ASCIISettings) {
    this.settings = settings
  }

  private adjustImage(imageData: ImageData): ImageData {
    const data = new Uint8ClampedArray(imageData.data)
    const mean = this.calculateMean(data)

    for (let i = 0; i < data.length; i += 4) {
      // Apply contrast
      for (let j = 0; j < 3; j++) {
        data[i + j] = (data[i + j] - mean) * this.settings.contrast + mean
      }

      // Apply brightness
      for (let j = 0; j < 3; j++) {
        data[i + j] = data[i + j] * this.settings.brightness
      }
    }

    return new ImageData(data, imageData.width, imageData.height)
  }

  private calculateMean(data: Uint8ClampedArray): number {
    let sum = 0
    for (let i = 0; i < data.length; i += 4) {
      sum += (data[i] + data[i + 1] + data[i + 2]) / 3
    }
    return sum / (data.length / 4)
  }

  private getColor(r: number, g: number, b: number): [number, number, number] {
    const avg = (r + g + b) / 3

    switch (this.settings.color_mode) {
      case 'true_color':
        return [r, g, b]
      case 'mono':
        return avg < 128 ? [0, 0, 0] : [255, 255, 255]
      case 'green':
        return [0, avg, 0]
      case 'blue':
        return [0, 0, avg]
      case 'red':
        return [avg, 0, 0]
      case 'cyan':
        return [0, avg, avg]
      case 'magenta':
        return [avg, 0, avg]
      case 'yellow':
        return [avg, avg, 0]
      default: // grayscale
        return [avg, avg, avg]
    }
  }

  private resizeImage(image: Image): Image {
    const origAspect = image.height / image.width
    const targetWidth = this.settings.width
    const targetHeight = Math.floor(targetWidth * origAspect)

    const canvas = createCanvas(targetWidth, targetHeight)
    const ctx = canvas.getContext('2d')
    ctx.drawImage(image, 0, 0, targetWidth, targetHeight)

    return canvas
  }

  private toGrayscale(imageData: ImageData): ImageData {
    const data = new Uint8ClampedArray(imageData.data)
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
      data[i] = data[i + 1] = data[i + 2] = avg
    }
    return new ImageData(data, imageData.width, imageData.height)
  }

  private pixelsToAscii(imageData: ImageData): string {
    const data = imageData.data
    const width = imageData.width
    const height = imageData.height
    let ascii = ''

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4
        const brightness = data[idx]
        const charIndex = Math.floor(brightness / 255 * (this.ASCII_CHARS.length - 1))
        ascii += this.ASCII_CHARS[charIndex]
      }
      ascii += '\n'
    }

    return ascii
  }

  private createAsciiImage(ascii: string, originalImage: Image): Image {
    const lines = ascii.split('\n')
    const charWidth = 10 // Approximate width of a character
    const charHeight = 20 // Approximate height of a character

    const imgWidth = charWidth * lines[0].length
    const imgHeight = Math.floor(imgWidth * (originalImage.height / originalImage.width))

    const canvas = createCanvas(imgWidth, imgHeight)
    const ctx = canvas.getContext('2d')

    // Set dark background
    ctx.fillStyle = 'rgb(32, 32, 32)'
    ctx.fillRect(0, 0, imgWidth, imgHeight)

    // Calculate spacing
    const totalTextHeight = charHeight * lines.length
    const scaleFactor = imgHeight / totalTextHeight
    const adjustedCharHeight = charHeight * scaleFactor

    // Draw characters
    ctx.font = `${this.fontSize}px monospace`
    ctx.textBaseline = 'top'

    for (let y = 0; y < lines.length; y++) {
      const line = lines[y]
      for (let x = 0; x < line.length; x++) {
        const char = line[x]
        const posX = x * charWidth
        const posY = y * adjustedCharHeight

        // Get color from original image
        const origX = Math.floor(x * originalImage.width / line.length)
        const origY = Math.floor(y * originalImage.height / lines.length)
        const pixelData = ctx.getImageData(origX, origY, 1, 1).data
        const [r, g, b] = this.getColor(pixelData[0], pixelData[1], pixelData[2])

        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
        ctx.fillText(char, posX, posY)
      }
    }

    return canvas
  }

  public async convert(imageData: ArrayBuffer): Promise<ArrayBuffer> {
    // Create image from buffer
    const image = await createImageBitmap(new Blob([imageData]))
    
    // Resize image
    const resized = this.resizeImage(image)
    
    // Get image data and apply adjustments
    const ctx = resized.getContext('2d')
    let data = ctx.getImageData(0, 0, resized.width, resized.height)
    data = this.adjustImage(data)
    
    // Convert to grayscale for ASCII conversion
    const gray = this.toGrayscale(data)
    
    // Convert to ASCII
    const ascii = this.pixelsToAscii(gray)
    
    // Create final image
    const asciiImage = this.createAsciiImage(ascii, image)
    
    // Convert to PNG buffer
    return await asciiImage.encode('png')
  }
} 