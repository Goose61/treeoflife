import numpy as np
from PIL import Image, ImageDraw, ImageFont
import os

class ASCIIArtConverter:
    # ASCII characters from darkest to lightest (expanded set)
    ASCII_CHARS = r'$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\|()1{}[]?-_+~<>i!lI;:,"^`\'. '
    
    def __init__(self, width=100, contrast=1.0, brightness=1.0, color_mode='true_color'):
        self.width = width
        self.contrast = contrast
        self.brightness = brightness
        self.color_mode = color_mode
        # Fixed font size for consistency
        self.font_size = 20
        # Try to load a monospace font
        try:
            self.font = ImageFont.truetype("Courier New", self.font_size)
        except:
            try:
                self.font = ImageFont.truetype("DejaVu Sans Mono", self.font_size)
            except:
                try:
                    self.font = ImageFont.truetype("Consolas", self.font_size)
                except:
                    self.font = ImageFont.load_default()
    
    def _adjust_image(self, image):
        """Apply contrast and brightness adjustments."""
        # Convert to float for calculations
        img_array = np.array(image, dtype=float)
        
        # Apply contrast
        mean = np.mean(img_array)
        img_array = (img_array - mean) * self.contrast + mean
        
        # Apply brightness
        img_array = img_array * self.brightness
        
        # Clip values to valid range
        img_array = np.clip(img_array, 0, 255)
        
        # Convert back to uint8
        return Image.fromarray(np.uint8(img_array))
    
    def _get_color(self, color):
        """Get color based on color_mode."""
        if self.color_mode == 'true_color':
            return color
        elif self.color_mode == 'mono':
            # Black and white only
            avg = sum(color) / 3
            return (0, 0, 0) if avg < 128 else (255, 255, 255)
        elif self.color_mode == 'green':
            avg = sum(color) / 3
            return (0, int(avg), 0)
        elif self.color_mode == 'blue':
            avg = sum(color) / 3
            return (0, 0, int(avg))
        elif self.color_mode == 'red':
            avg = sum(color) / 3
            return (int(avg), 0, 0)
        elif self.color_mode == 'cyan':
            avg = sum(color) / 3
            return (0, int(avg), int(avg))
        elif self.color_mode == 'magenta':
            avg = sum(color) / 3
            return (int(avg), 0, int(avg))
        elif self.color_mode == 'yellow':
            avg = sum(color) / 3
            return (int(avg), int(avg), 0)
        else:  # grayscale
            avg = int(sum(color) / 3)
            return (avg, avg, avg)
    
    def _resize_image(self, image):
        """Resize image maintaining aspect ratio."""
        # Get original dimensions
        orig_width, orig_height = image.size
        orig_aspect = orig_height / orig_width
        
        # Calculate target dimensions
        target_width = self.width
        target_height = int(target_width * orig_aspect)
        
        return image.resize((target_width, target_height))
    
    def _to_grayscale(self, image):
        """Convert image to grayscale."""
        return image.convert('L')
    
    def _pixels_to_ascii(self, image):
        """Convert pixels to ASCII characters."""
        pixels = np.array(image)
        ascii_str = []
        
        # Convert each pixel to an ASCII character
        for row in pixels:
            ascii_str.append(''.join([self.ASCII_CHARS[int(pixel / 255 * (len(self.ASCII_CHARS) - 1))] 
                                    for pixel in row]))
        return '\n'.join(ascii_str)
    
    def _create_ascii_image(self, ascii_str, original_image):
        """Create an image from ASCII string with color based on original image."""
        # Calculate dimensions
        lines = ascii_str.split('\n')
        char_width = self.font.getbbox('A')[2]
        char_height = self.font.getbbox('A')[3]
        
        # Get original dimensions for aspect ratio
        orig_width, orig_height = original_image.size
        orig_aspect = orig_height / orig_width
        
        # Calculate image dimensions to match original aspect ratio
        img_width = char_width * len(lines[0])
        img_height = int(img_width * orig_aspect)
        
        # Create new image with dark background
        ascii_image = Image.new('RGB', (img_width, img_height), (32, 32, 32))
        draw = ImageDraw.Draw(ascii_image)
        
        # Get color information from original image
        original_colors = np.array(original_image.resize((len(lines[0]), len(lines))))
        
        # Calculate vertical spacing to distribute lines evenly
        total_text_height = char_height * len(lines)
        scale_factor = img_height / total_text_height
        adjusted_char_height = char_height * scale_factor
        
        # Draw each character with corresponding color
        for y, line in enumerate(lines):
            for x, char in enumerate(line):
                # Get color from original image and apply color mode
                color = tuple(map(int, original_colors[y, x]))
                final_color = self._get_color(color)
                # Calculate position to maintain aspect ratio
                pos_x = x * char_width
                pos_y = y * adjusted_char_height
                # Draw character
                draw.text((pos_x, pos_y), char, font=self.font, fill=final_color)
        
        return ascii_image
    
    def convert(self, image_input, output_dir="ascii_output"):
        """Convert image to ASCII art and save both text and image versions."""
        os.makedirs(output_dir, exist_ok=True)
        
        # Handle both file paths and PIL Image objects
        if isinstance(image_input, str):
            # It's a file path
            with Image.open(image_input) as img:
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                img = self._resize_image(img)
                img = self._adjust_image(img)
                original_resized = img.copy()
                img = self._to_grayscale(img)
                ascii_str = self._pixels_to_ascii(img)
                ascii_image = self._create_ascii_image(ascii_str, original_resized)
        else:
            # It's a PIL Image object
            img = image_input
            if img.mode != 'RGB':
                img = img.convert('RGB')
            img = self._resize_image(img)
            img = self._adjust_image(img)
            original_resized = img.copy()
            img = self._to_grayscale(img)
            ascii_str = self._pixels_to_ascii(img)
            ascii_image = self._create_ascii_image(ascii_str, original_resized)
        
        return ascii_str, ascii_image

if __name__ == "__main__":
    # Example usage
    converter = ASCIIArtConverter(font_size=12, width=100)
    if os.path.exists("test.jpg"):
        ascii_str, ascii_image = converter.convert("test.jpg")
        print(ascii_str)