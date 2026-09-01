# Push this to GitHub

The repo is already initialised, committed, and pointed at
`https://github.com/Prathamm2002/khaata.git`. Nothing to set up.

## 1. Unzip, then push

Unzip `khaata-repo.zip` anywhere, open a terminal in that folder, and run:

```
git push -u origin main
```

That's it. It uses the GitHub credentials you already have on your machine.

If git asks for a password, GitHub no longer accepts account passwords — either
sign in through the browser prompt it offers, or install the GitHub CLI
(`gh auth login`) once and try again.

**On the branch name:** if your repo was created with a `master` default, use
`git push -u origin main:master` instead, or rename with `git branch -M main`.

## 2. Deploy on Vercel

1. Go to **vercel.com/new**
2. Import `Prathamm2002/khaata`
3. Framework preset: **Other**. Leave build command and output directory empty —
   it is plain static files, there is nothing to build.
4. Deploy.

From then on every `git push` redeploys automatically.

## 3. First run

Open the Vercel URL, enter your Supabase **project URL** and **anon key**
(Supabase dashboard → Settings → API), then sign in.

Then open the same URL in **Safari** on your iPhone → Share → **Add to Home Screen**.

## What's in the commit

```
.gitignore     index.html      manifest.json   sw.js
vercel.json    icon-180.png    icon-192.png    icon-512.png
README.md
```

No credentials are committed — checked before packaging. `mock.json` (which held
your real transactions during testing) is gitignored and was deleted, so it
cannot leak into a public repo.
