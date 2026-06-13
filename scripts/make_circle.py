import os
from PIL import Image, ImageDraw

def make_circle():
    logo_path = 'public/logo.png'
    circle_path = 'public/logo-circle.png'
    public_fav = 'public/favicon.ico'
    app_fav = 'src/app/favicon.ico'

    if not os.path.exists(logo_path):
        print(f"Error: {logo_path} not found.")
        return

    # Load image and convert to RGBA
    img = Image.open(logo_path).convert("RGBA")
    width, height = img.size

    # Crop to a square center
    size = min(width, height)
    left = (width - size) // 2
    top = (height - size) // 2
    right = left + size
    bottom = top + size
    img = img.crop((left, top, right, bottom))

    # Create circular mask
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size, size), fill=255)

    # Paste using the circular mask
    circular_img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    circular_img.paste(img, (0, 0), mask=mask)

    # Save circle logo
    circular_img.save(circle_path, "PNG")
    print(f"Saved circular logo to {circle_path}")

    # Save as .ico favicon to public/ and src/app/
    circular_img.save(public_fav, format="ICO", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
    circular_img.save(app_fav, format="ICO", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
    print(f"Saved favicon to {public_fav} and {app_fav}")

if __name__ == "__main__":
    make_circle()
