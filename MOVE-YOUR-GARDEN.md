# Moving your Little Sprout garden to the website

## The short version

Your garden on your computer is very likely safe, but I couldn't move it for
you. You can do it yourself in about five minutes with two new buttons in
Settings. The steps are below.

## 1. Where your progress is

The game saves into your browser's own storage, filed under the address you
played on. That address was most likely `http://localhost:5173` (from
`npm run dev`), or `http://localhost:4173` if you used `npm run preview`.

Browsers keep each address's storage separate. So the website
(`https://jenelijeneli.github.io/little-sprout/`) can't see the computer's
garden, even in the same browser. That's why it started a new game. Nothing
was deleted.

## 2. Is it recoverable?

Very likely yes, as long as you haven't cleared that browser's browsing data
and didn't play in a private window.

I couldn't look at your browser's storage from here, so I haven't seen your
save myself. You'll know for sure in step 4 below: if your coins and crops
show up at the old address, it's there.

Older copies are also listed under **Settings › Move your garden**, if any
exist:

- the copy kept before the cottage update;
- a copy kept before a reset;
- a copy kept before loading a file.

## 3. Has it been restored on the website?

No. It still needs the manual move below. I also couldn't open the live
website from my side, so I haven't checked the website itself. All my testing
was on a copy of the finished game set up the same way the website serves it.

## 4. Steps for you

### Step A: put the update on the website

Open **Command Prompt** and run:

```
cd "%USERPROFILE%\Documents\little-sprout"
npm test
git add .
git commit -m "Add save to file and load from file"
git push
```

Then open your repository's **Actions** tab on GitHub and wait for the green ✓.

### Step B: save the computer's garden to a file

In the same Command Prompt window:

1. Run `npm run dev`.
2. In **the same browser you played in before**, open `http://localhost:5173`.
3. Check that your coins, level and crops are there. If you see a brand-new
   garden, try `http://localhost:4173` (that one needs `npm run preview`) or
   your other browser. Opening the wrong one doesn't harm your real garden.
4. Click the gear at the top right, then **Save garden to a file**. The file
   lands in your Downloads folder.

### Step C: load the file on the website

1. Open `https://jenelijeneli.github.io/little-sprout/` and press **Ctrl + F5**.
2. Click the gear, then **Load garden from a file…**, and pick the file.
3. A table shows "Loading" (your file) next to "Here now" (the website's new
   garden). Check that the coins and level match, then click
   **Yes, replace my garden**.
4. Press **F5**. Your garden should still be there.

The website's starter garden is kept as a backup, in case you want it back.

## 5. What changed

### New in Settings: "Move your garden"

- **Save garden to a file** downloads the whole garden as a `.json` file. It
  doesn't change the garden.
- **Load garden from a file…** works in this order:
  1. It checks the file first. Wrong files, damaged files and files from a
     newer version are refused with a plain message, and nothing changes.
  2. It shows a side-by-side summary and asks before replacing anything.
  3. It keeps the replaced garden as a backup.
- **A list of every older copy kept in this browser.** You can download any of
  them, or switch back to one (it asks first, the same way).

### Safer saving

- **Reset farm** now keeps a copy of the garden it replaces.
- A save that can't be read is never written over by a second unreadable one.
- The game asks the browser to keep its storage permanently.
- If a browser blocks saving (in a private window, for example), you get a
  warning telling you to save to a file.
- Your existing saves load exactly as before. There's no server, no account
  and no cost.

### Files

- `src/systems/saveManager.js`
- `src/systems/game.js`
- `src/components/settingsPanel.js`
- `src/components/app.js`
- `src/main.js`
- `src/styles/ui.css`
- `tests/saveFile.test.js` (new)
- `README.md`, which has a new section 9 with these steps

## 6. Was it checked after a refresh?

Yes, but on my test copy, not on your real garden or the live website.

On a copy of the finished game set up like the website, I:

1. played a garden at one address;
2. saved it to a file with the button;
3. loaded it at a second address that had its own garden;
4. refreshed the page.

Coins, level, XP, crops, seeds, harvest, beds, cottage furniture,
decorations, friends and quests all matched, and you could keep playing. Cancel
and wrong files changed nothing. The replaced garden was kept as a backup.
There were no errors. This was checked at desktop size and phone size.

Every test passes:

- game rules: 35 of 35;
- moving a garden: 36 of 36;
- the finished game as it will run online: 22 of 22;
- the full play-through: 64 of 64.

After you finish Step C, the refresh in its last step is the check on your
real garden.
