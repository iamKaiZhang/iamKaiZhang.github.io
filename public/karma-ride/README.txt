Karma Ride project website
==========================

index.html
    The whole site in one file. All images are embedded (base64), all CSS/JS
    inline; the only external dependency is Google Fonts (Geist, Geist Mono,
    Newsreader). To host: upload this folder as-is; no build step needed.

karma-ride-poster.pdf
    The poster. The hero's "Poster (PDF)" button links to exactly this
    filename, relative to index.html, so keep the two files side by side
    (or edit the two href="karma-ride-poster.pdf" occurrences in index.html).

source/
    hero-illustration-original.png
        The generated freeway illustration, full panorama.
    hero-illustration-web.jpg
        The version embedded in index.html: crop (0,0)-(1760,783) of the
        original, JPEG quality 84. The rightward shift, warm tone, and the
        angled dissolve are applied in CSS (.hero-bg rules), not in the file.

No data files are needed; every number on the page is hard-coded in the HTML.
