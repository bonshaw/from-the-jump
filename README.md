# Take me back… · Right From the Jump

A complete single-screen romantic wedding music player for GitHub Pages, featuring your actual first-dance recording and the original photographs.

## Publish to GitHub Pages (free)

1. Create a **public** GitHub repository (for example `right-from-the-jump`). The entire repository will be publicly visible, including the audio and photos. Confirm the couple is comfortable with that before publishing.
2. Extract the ZIP. Upload **all contents** of the extracted `right-from-the-jump-site` folder to the repository root, including the hidden `.github` directory, `photos`, `audio`, `scripts`, `index.html`, and other files. With Git on Windows, copy the files into the repo, commit, and push to the `main` branch.
3. In GitHub, open **Settings → Pages** and under **Build and deployment → Source** select **GitHub Actions**. You may be prompted to save.
4. Visit **Actions → Publish wedding memory page**, where the deployment should be running automatically after push. If necessary, use **Run workflow**.
5. The website address will normally be `https://YOUR-USERNAME.github.io/right-from-the-jump/` — replace the username and repository name with your own. Confirm that link works on a phone before making the permanent QR code.

The song is at `audio/right-from-the-jump.mp3`. The browser generally requires a user tap before it will play music.

## Add more wedding photographs any time

Put them in **`photos/`** and push/commit. The existing GitHub Action scans the directory and creates a fresh photo list every time the repository updates. No HTML editing. Avoid very large photos, which will take longer for mobile visitors to load.

**Linked sequence:** `FB_IMG_1792178908223.jpg` (normal) immediately followed by `FB_IMG_1792178854679.jpg` (cheers). They are a *single shuffled moment*. Neither can appear on its own, and if one is missing both are omitted.

**Cover photo:** `photos/cover.jpg`. It appears before playback and fades back when playback pauses or ends.

## Customize

- The date and text can be changed in `index.html`.
- Colours and appearance are in `styles.css`. The player controls and status line have fixed geometry so starting or finishing the song does not change the layout; the app uses a stable viewport height on mobile.
- Song timing and transitions are in `app.js`: `INTRO_END_SECONDS` controls the opening period that stays on the couple portrait; the hold times control when photos change. Transitions are stationary, gentle opacity fades (6 seconds normally, 6.9 seconds for the return to the couple), and `FINALE_START_SECONDS` sets the couple-photo return to **3:30** (210 seconds) into the song.
- The photo lists `gallery.js` and `gallery.json` are automatically regenerated from the `photos` directory by `scripts/build_gallery.py` in the GitHub Pages workflow. `gallery.js` allows direct local previews without a web server.

## Local test on Windows — simply double-click

1. **Extract the entire ZIP** using *Extract All*. Do not run `index.html` from inside the ZIP.
2. Open the extracted folder and **double-click `index.html`** in Chrome or Edge. The player and slideshow work without starting a server, as long as the folders and `gallery.js` remain beside the HTML file.
3. Press Play. The image intentionally remains on the couple for the first **20 seconds** (MC introduction and audience cheering); then the photo sequence begins.
4. To quickly test transitions, drag the progress bar to a point past 0:20 while the music is playing, and allow a couple of seconds for the first change. To test the ending, seek to about **3:20**, let the song run, and the slideshow should return to the main couple portrait at **3:30** and remain there.

When adding photos for **local** preview, regenerate the photo list after copying images into `photos/`. From the site folder run `python scripts/build_gallery.py` (Python 3 required). After you upload/push changes to **GitHub**, the GitHub Actions workflow runs this automatically, so you don't need Python for future online additions.

## Privacy and reliability

GitHub Pages is a public website; the `noindex` meta tag requests search engines not to index it but **does not make it private**. The MP3 and all uploaded photos are publicly retrievable from the repository. Do not publish anything the couple wants kept private. GitHub's free Pages service is subject to its current terms, availability, and usage limits. Keep an offline backup of this site and the original song/photos so you can move hosting later. The future printed QR code will point to the GitHub Pages URL; if that URL changes, the QR code will need a redirect or replacement.
