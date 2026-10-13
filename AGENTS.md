<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Application architecture
- Keep the streaming catalog in a browser-safe shared module and give each content view a TanStack file route, so navigation and per-page metadata remain consistent.
- Manage the account session and watchlist in a single root provider using the generated Cloud client; watchlist access is limited by owner-only database policies.
- Use local illustrative artwork and catalog entries until licensed episodes are provided; do not present sample stories as playable licensed video.
- Define all visual roles in the global semantic token system and reuse the shared Button variants for interactive controls.
