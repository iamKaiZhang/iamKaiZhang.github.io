# Wortreise scenes

Background illustrations made by the site owner from photos under the Unsplash License.
The app picks one at random on every visit (`js/scenes.js`).

To add a scene:
1. Portrait image, about 970×1620 or larger, landmark in the lower part, top and left left as blank paper, no text in the image.
2. Save as JPEG (quality ~84) in this folder.
3. Add an entry to `scenes.json`:
   - `file`: the image file name
   - `paper`: the paper colour at the image edge (the page background is set to it)
   - `focus` / `mfocus`: CSS `object-position` for desktop and phone, so the landmark stays in view
   - `place`: "Place · Land" in German (the first part is used for passport stamps)
   - `de` / `en`: the caption, in German with its English line
