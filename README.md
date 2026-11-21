# Pahuway Movies

A beginner-friendly static website/PWA starter for a personal movie library.

## Preview locally
Open `index.html` in a browser. For service-worker/offline features, publish it over HTTPS (GitHub Pages provides HTTPS).

## Publish with GitHub Pages
1. Open your repository.
2. Choose **Add file → Upload files**.
3. Upload all files in this folder (not the ZIP itself).
4. Commit the changes.
5. In the repository, open **Settings → Pages**.
6. Under Build and deployment, choose **Deploy from a branch**, select `main` and `/ (root)`, then Save.
7. Wait for GitHub Pages to publish the site.

## Important limitations
- This is a front-end prototype, not a production streaming service.
- The Admin demo is not protected by real authentication. Anyone who can open the website can use it.
- Movie entries are stored in the current browser's local storage only. They are not shared between users or devices and may be cleared by the browser.
- Video links open in a new tab. Use only videos you own, have permission to share, or that are licensed for your use.
- Do not upload copyrighted movies without permission.

A later version can add secure sign-in, a hosted database, and a proper admin-only workflow. Those require a backend service and configuration; GitHub Pages alone cannot provide them.
