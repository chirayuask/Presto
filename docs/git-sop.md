# Git SOP — Pushing from this Mac

Standard operating procedure for committing and pushing code under the right GitHub identity on this machine.

---

## The setup on this Mac

You have two GitHub accounts configured:

| Account | Purpose | SSH key | Host alias |
|---|---|---|---|
| `chirayuask` | Personal | `~/.ssh/id_ed25519_personal` | `github.com-personal` |
| `chirayu-fancraze` | Work | `~/.ssh/id_ed25519_work` | `github.com-work` |

Git identity is chosen **automatically by folder location** via `~/.gitconfig`:

```ini
[includeIf "gitdir:~/Documents/Personal/"]
    path = ~/.gitconfig-personal   # → chirayuask identity
```

- Anything under `~/Documents/Personal/**` → commits as **`chirayuask`**
- Anything else → commits as **`chirayu-fancraze`** (global default)

**The commit identity is handled automatically.** You never need to `git config user.*` per-repo.

---

## SOP: pushing a new personal repo

### 1. Put the project in the right folder

```bash
cd ~/Documents/Personal/<project-name>
```

This is what triggers the `chirayuask` identity. Don't skip this.

### 2. Init, stage, commit

```bash
git init -b main
git add .
git commit -m "Initial commit"
```

Verify the author is correct:
```bash
git log -1 --format='%an <%ae>'
# → chirayuask <chirayuvarshney29@gmail.com>
```

If it says `chirayu-fancraze`, your folder is not under `~/Documents/Personal/`. Stop and move it.

### 3. Create the repo on GitHub

- Go to https://github.com/chirayuask
- **Create empty repo** (no README, no license, no .gitignore — you already have those)
- Copy the repo name

### 4. Add remote using the PERSONAL SSH alias

**Critical step.** Don't use the default URL GitHub shows you — it routes to the wrong SSH key.

```bash
# ✅ DO THIS — uses chirayuask's SSH key
git remote add origin git@github.com-personal:chirayuask/<repo-name>.git

# ❌ NOT this — defaults to work SSH key, will fail with permission denied
git remote add origin git@github.com:chirayuask/<repo-name>.git
```

The difference is the hostname: `github.com-personal` vs `github.com`. The `-personal` suffix is the alias defined in `~/.ssh/config`.

### 5. Push

```bash
git push -u origin main
```

Done. No tokens, no prompts.

---

## SOP: pushing a work repo

Same pattern, mirrored:

```bash
# Work repos live anywhere outside ~/Documents/Personal/
cd ~/Documents/Work/<project>

git init -b main
git add . && git commit -m "Initial commit"

# Use the WORK SSH alias
git remote add origin git@github.com-work:<org>/<repo>.git

git push -u origin main
```

---

## Troubleshooting

### "Permission denied to chirayu-fancraze" when pushing a personal repo

You used the default `git@github.com:...` URL instead of `git@github.com-personal:...`. Fix:

```bash
git remote set-url origin git@github.com-personal:chirayuask/<repo>.git
git push -u origin main
```

### Commits show the wrong author name

Your folder is not under `~/Documents/Personal/`. Either:

- **Move the repo** there: `mv <project> ~/Documents/Personal/`, then `git commit --amend --reset-author` on your commits, or
- **Override for this repo only**:
  ```bash
  git config user.name chirayuask
  git config user.email chirayuvarshney29@gmail.com
  git commit --amend --reset-author --no-edit
  ```

### HTTPS credential prompts / cached wrong PAT

`~/.git-credentials` has the old `chirayu-fancraze` token stored. You generally don't need HTTPS on this Mac — use SSH aliases (step 4 above) and bypass credentials entirely. If you must use HTTPS for a specific repo, use a per-URL token:

```bash
git push https://chirayuask:<PAT>@github.com/chirayuask/<repo>.git main
```

### `git remote add origin ... # some comment` fails

Shell comments (`#`) on the same line as a git command get parsed as part of the URL. Remove the comment, or put it on the line above:

```bash
# Use SSH alias for personal account
git remote add origin git@github.com-personal:chirayuask/<repo>.git
```

### Check which SSH key GitHub will accept

```bash
ssh -T git@github.com-personal   # → Hi chirayuask! ...
ssh -T git@github.com-work       # → Hi chirayu-fancraze! ...
```

If either says "Permission denied (publickey)", the key isn't registered to that account — add it at https://github.com/settings/keys (for the corresponding account).

---

## One-line summary

> **For personal repos**: put it in `~/Documents/Personal/`, commit normally, remote = `git@github.com-personal:chirayuask/<repo>.git`, push.

That's it. Identity, keys, and auth are all handled automatically.
