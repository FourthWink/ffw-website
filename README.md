# ffw-website

Shopify theme repository for Fourth Wink.

## Local setup

1. Install Node.js LTS from https://nodejs.org/.
2. Install Shopify CLI:

   ```powershell
   npm install -g @shopify/cli @shopify/theme
   ```

3. Log in to Shopify and pull the current theme into this repo:

   ```powershell
   shopify theme pull --store your-store.myshopify.com
   ```

4. Start a preview server:

   ```powershell
   shopify theme dev --store your-store.myshopify.com
   ```

5. Run theme checks before pushing:

   ```powershell
   shopify theme check
   ```

## Recommended workflow

- Keep `main` as the production-ready branch.
- Create feature branches for edits.
- Pull the current Shopify theme into this repo before making code changes.
- Preview changes with `shopify theme dev`.
- Push to GitHub, then connect the repo branch to Shopify under **Online Store > Themes > Add theme > Connect from GitHub**.
