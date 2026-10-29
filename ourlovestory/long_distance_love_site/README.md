# A Little Piece of Us — romantic website

A responsive, romantic long-distance love website with:
- An envelope that opens to reveal a letter
- Scroll reveal animations
- A scrapbook section for your own photos
- Floating hearts and sparkles
- An animated digital bouquet
- A vintage newspaper with **LOVE** as the headline and a surprise message button

## Open it in VS Code
1. Extract the ZIP file.
2. In VS Code, choose **File → Open Folder** and open `long_distance_love_site`.
3. Open `index.html` in a browser. For a smoother workflow, you can use the VS Code **Live Server** extension and click **Go Live**.

## Add your photos
Put your images in `assets/photos/` and name them:
- `photo-1.jpg`
- `photo-2.jpg`
- `photo-3.jpg`

If your image filenames are different, update the matching `src` values in `index.html`. JPG, PNG, and WebP are fine if you update the filenames.

## Add a video
Place your video file in `assets/videos/`. To show it on the page, add a video element in `index.html`, for example:

```html
<video controls playsinline width="100%">
  <source src="assets/videos/your-video.mp4" type="video/mp4">
  Your browser does not support this video.
</video>
```

## Personalize the message
Open `index.html` and edit the letter paragraphs, scrapbook captions, and newspaper story. Save your changes and refresh the browser.

## Files
- `index.html` — the website content
- `style.css` — colors, layout, and animations
- `script.js` — envelope, scroll reveals, floating hearts, and newspaper interaction
- `assets/photos/` — place your pictures here
- `assets/videos/` — place your videos here

The Google Fonts import needs an internet connection; the site otherwise uses fallback fonts.
