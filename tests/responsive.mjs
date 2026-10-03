import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium, firefox, webkit } from 'playwright';
import { startPreview } from './helpers/preview.mjs';
import { capturePage } from './helpers/screenshot.mjs';
import { inspectInterface } from '../.vinasig/standards/templates/web/interface.mjs';
import AxeBuilder from '@axe-core/playwright';
import astroConfig from '../astro.config.mjs';

const phase = process.argv[2] || new Date().toISOString().replaceAll(':', '-');
if (!/^[a-zA-Z0-9_.-]+$/.test(phase) || phase === '.' || phase === '..') {
  throw new Error('Use a simple run name without directory separators.');
}
const root = path.resolve('output/responsive/runs', phase);
const mandatory = [[360,800],[390,844],[768,1024],[1024,768],[1440,900]];
const sizes = process.env.RESPONSIVE_WIDTHS
  ? process.env.RESPONSIVE_WIDTHS.split(',').map(Number).map(w=>[w,mandatory.find(s=>s[0]===w)?.[1]||900])
  : mandatory;
if (sizes.some(([width]) => !Number.isInteger(width) || width < 320)) {
  throw new Error('RESPONSIVE_WIDTHS must contain comma-separated integer widths of at least 320.');
}
const routes = (await fs.readdir(new URL('../src/pages/', import.meta.url)))
  .filter((file) => file.endsWith('.astro'))
  .map((file) => file === 'index.astro' ? '/' : `/${file.replace('.astro', '')}/`);
const results=[];
const engines = { chromium, firefox, webkit };
const engine = process.env.RESPONSIVE_ENGINE || 'chromium';
if (!Object.hasOwn(engines, engine)) throw new Error('RESPONSIVE_ENGINE must be chromium, firefox or webkit.');
if (process.env.RESPONSIVE_BROWSER && engine !== 'chromium') throw new Error('A Chromium channel requires RESPONSIVE_ENGINE=chromium.');
const preview = await startPreview(root);
const base = preview.baseURL;
let browser;
const check=(name,pass,detail)=>results.push({width:currentWidth,name,pass,detail});
let currentWidth=0;
try {
  browser = await engines[engine].launch({
    ...(process.env.RESPONSIVE_BROWSER ? { channel: process.env.RESPONSIVE_BROWSER } : {}),
    headless: true,
  });
  const requests = await browser.newContext();
  const sitemap = await requests.request.get(`${base}/sitemap.xml`);
  check('sitemap responds with XML',sitemap.ok()&&sitemap.headers()['content-type']?.includes('xml'));
  const sitemapText = await sitemap.text();
  for(const route of routes.filter(route=>route!=='/404/')) {
    const url = new URL(`${base}${route}`);
    check(`sitemap includes the canonical ${route}`,sitemapText.includes(`<loc>${new URL(url.pathname,astroConfig.site).href}</loc>`));
  }
  check('sitemap excludes the error page',!sitemapText.includes('/404/'));
  await requests.close();
  for (const [width,height] of sizes) {
    currentWidth=width;
    // Firefox exposes touch input but Playwright does not support its isMobile flag.
    const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,reducedMotion:process.env.RESPONSIVE_MOTION==='normal'?'no-preference':'reduce',hasTouch:process.env.RESPONSIVE_TOUCH==='true',isMobile:process.env.RESPONSIVE_TOUCH==='true'&&width<600&&engine!=='firefox'});
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.setDefaultTimeout(15_000);
    const dir=path.join(root,`checks-${width}x${height}`);
    await fs.mkdir(dir,{recursive:true});
    for (const route of routes) {
      const response = await page.goto(`${base}${route}`, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      // The explicit 404 page is a static resource. An unknown URL must produce the error status.
      check(`${route} responds`, response?.status() === 200, response?.status());
      const geometry = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
      check(`${route} has no page overflow`, geometry.scroll <= geometry.width + 1, geometry);
      check(`${route} exposes its heading`, await page.locator('main h1').isVisible());
      check(`${route} has no broken images`, await page.locator('img').evaluateAll((images) => images.every((image) => image.complete && image.naturalWidth > 0)));
      check(`${route} loads the local Space Grotesk font`, await page.evaluate(() => [...document.fonts].some((font) => font.family.replaceAll('"', '') === 'Space Grotesk' && font.status === 'loaded')));
      for (const icon of await page.locator('link[rel="icon"]').evaluateAll((icons) => icons.map((icon) => icon.href))) {
        check(`${route} resolves favicon ${icon.split('/').at(-1)}`, (await page.request.get(icon)).ok());
      }
      const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
      check(`${route} has no automated accessibility violations`, accessibility.violations.length === 0, accessibility.violations.map((violation) => ({ id: violation.id, nodes: violation.nodes.map((node) => ({ target: node.target, summary: node.failureSummary })) })));
      await capturePage(page, path.join(dir, `route-${route === '/' ? 'index' : route.split('/')[1]}--default.png`));
    }
    await page.goto(`${base}/components/`, { waitUntil: 'networkidle' });
    const placement = page.getByRole('combobox', { name: 'Placement', exact: true });
    await placement.scrollIntoViewIfNeeded();
    if (process.env.RESPONSIVE_TOUCH === 'true') await placement.tap();
    else await placement.click();
    const placementPanel = page.locator('#placement-options');
    check('Placement exposes its styled options', await placementPanel.isVisible());
    check('Placement open copy meets interface rules', (await page.evaluate(inspectInterface)).length === 0);
    const placementBounds = await placementPanel.boundingBox();
    check('Placement options fit the viewport', !!placementBounds && placementBounds.x >= 0 && placementBounds.x + placementBounds.width <= width + 1 && placementBounds.y >= 0 && placementBounds.y + placementBounds.height <= height + 1, placementBounds);
    await page.screenshot({ path: path.join(dir, 'placement--open.png') });
    await page.keyboard.press('End');
    await page.keyboard.press('Escape');
    check('Placement cancellation preserves its value and focus', await page.locator('#placement').inputValue() === 'center' && await placement.evaluate(el => el === document.activeElement));
    await placement.press('Home');
    await placement.press('Enter');
    check('Placement keyboard selection updates form state', await page.locator('#placement').inputValue() === 'left');
    await placement.click();
    await placementPanel.getByRole('option', { name: 'Bottom right', exact: true }).click();
    check('Placement pointer selection updates form state', await page.locator('#placement').inputValue() === 'right');
    await page.goto(`${base}/`, { waitUntil: 'networkidle' });
    await page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link', { name: 'Brand & logo' }).focus();
    await Promise.all([
      page.waitForURL(`${base}/brand/`, { waitUntil: 'networkidle' }),
      page.keyboard.press('Enter'),
    ]);
    check('keyboard navigation opens the base-aware brand route', page.url() === `${base}/brand/`);
    check('brand navigation exposes the active page', await page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link', { name: 'Brand & logo' }).getAttribute('aria-current') === 'page');
    const missing = await page.goto(`${base}/__responsive_missing_page__/`, { waitUntil: 'networkidle' });
    check('unknown route returns HTTP 404', missing?.status() === 404, missing?.status());
    check('unknown route renders the custom error page', await page.getByRole('heading', { name: 'Page not found', level: 1 }).isVisible());
    await page.screenshot({ path: path.join(dir, 'route-missing--default.png'), fullPage: true });
    await page.goto(`${base}/elements/`,{waitUntil:'networkidle'});
    await page.evaluate(()=>document.fonts.ready);
    const entry=id=>page.locator(`.element-entry[id='${id}']`);
    const shot=async(id,state='default')=>{await entry(id).scrollIntoViewIfNeeded();await entry(id).screenshot({path:path.join(dir,`${id}--${state}.png`)});};
    const within=async(child,parent)=>page.evaluate(([c,p])=>{
      const a=document.querySelector(c).getBoundingClientRect(),b=document.querySelector(p).getBoundingClientRect();
      return {fits:a.left>=b.left-2&&a.right<=b.right+2&&a.top>=b.top-2&&a.bottom<=b.bottom+2,child:{x:a.x,y:a.y,width:a.width,height:a.height},parent:{x:b.x,y:b.y,width:b.width,height:b.height}};
    },[child,parent]);
    const noHorizontal=async()=>page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
    const visibleRect=async locator=>locator.evaluate(el=>{
      const r=el.getBoundingClientRect();return {fits:r.left>=-1&&r.right<=innerWidth+1&&r.top>=-1&&r.bottom<=innerHeight+1,x:r.x,y:r.y,width:r.width,height:r.height};
    });
    const tap=async locator=>{
      await locator.scrollIntoViewIfNeeded();
      // Root smooth scrolling can keep moving a control after protocol scrolling.
      // Wait for its actual viewport geometry; retain normal motion in the page.
      await locator.evaluate(async element=>{
        let previous=element.getBoundingClientRect(),stable=0;
        for(let frame=0;frame<180;frame++) {
          await new Promise(resolve=>requestAnimationFrame(resolve));
          const current=element.getBoundingClientRect();
          const unchanged=Math.abs(current.x-previous.x)<0.1&&Math.abs(current.y-previous.y)<0.1&&Math.abs(current.width-previous.width)<0.1&&Math.abs(current.height-previous.height)<0.1;
          stable=unchanged?stable+1:0;
          if(stable>=4)return;
          previous=current;
        }
        throw new Error('The interactive control did not settle within 180 animation frames.');
      });
      return process.env.RESPONSIVE_TOUCH==='true'?locator.tap():locator.click();
    };
    const settle=async()=>page.waitForTimeout(process.env.RESPONSIVE_MOTION==='normal'?300:40);
    let geom=await noHorizontal();check('page horizontal overflow',geom.scroll<=geom.width+1,geom);
    await page.keyboard.press('Tab');
    const skip=page.locator('.skip-link');
    check('skip link becomes visible when keyboard focused',await skip.evaluate(el=>el===document.activeElement&&getComputedStyle(el).clipPath==='none'&&el.getBoundingClientRect().top>=0));
    await skip.press('Enter');
    check('skip link reaches main content',await page.evaluate(()=>location.hash==='#main'));
    await page.keyboard.press('Tab');
    const calendar=entry('date-picker').locator('[data-action="calendar-toggle"]');
    if(await calendar.getAttribute('aria-expanded')==='false')await tap(calendar);
    await entry('date-picker').locator('.sample-calendar').waitFor({state:'visible'});
    check('calendar trigger opens a visible panel',await entry('date-picker').locator('.sample-calendar').isVisible());
    const rows=await entry('date-picker').locator('.sample-calendar-grid [role="row"]').evaluateAll(els=>els.map(el=>{
      const children=[...el.children].map(e=>e.getBoundingClientRect());return {columns:getComputedStyle(el).gridTemplateColumns.split(' ').length,minWidth:Math.min(...children.map(c=>c.width)),height:el.getBoundingClientRect().height};
    }));
    check('calendar semantic rows have seven usable columns',rows.every(r=>r.columns===7&&r.minWidth>=20&&r.height>=20),rows);
    await shot('date-picker');
    const calendarPanel=entry('date-picker').locator('.sample-calendar');
    const calendarMonth=await calendarPanel.getAttribute('data-calendar-month');
    await tap(calendarPanel.locator('[data-action="calendar-next"]'));
    check('calendar month navigation preserves a valid civil date',await calendarPanel.getAttribute('data-calendar-month')!==calendarMonth);
    await tap(calendarPanel.locator('[data-action="calendar-prev"]'));
    await calendarPanel.evaluate(el=>el.dataset.calendarMonth='invalid');
    await tap(calendarPanel.locator('[data-action="calendar-next"]'));
    check('calendar ignores malformed month state without replacing its grid',await calendarPanel.getAttribute('data-calendar-month')==='invalid'&&await calendarPanel.locator('[role="row"]').count()===rows.length);
    await calendarPanel.evaluate((el,month)=>el.dataset.calendarMonth=month,calendarMonth);
    const inbox=entry('inbox-split-view');
    const inboxWidth=await inbox.locator('.sample-inbox').evaluate(e=>e.clientWidth);
    if(inboxWidth<=368) {
      const columns=await inbox.locator('.sample-inbox-workspace').evaluate(e=>getComputedStyle(e).gridTemplateColumns);
      check('narrow inbox has one track',columns.split(' ').length===1,columns);
      await inbox.locator('[data-action="inbox-select-message"]').filter({visible:true}).nth(1).click();
      await settle();
      const detail=await within('#inbox-split-view .sample-inbox-message-detail','#inbox-split-view .sample-inbox');
      check('selected inbox message remains contained',detail.fits,detail);
      await shot('inbox-split-view','detail');
      await inbox.locator('[data-action="inbox-back-to-list"]').click();
      check('mobile inbox back restores list',await inbox.locator('.sample-inbox-message-list').isVisible());
    }
    await shot('inbox-split-view');
    const save=await entry('save-panel').locator('.sample-save-heading').boundingBox();
    check('save heading has reading width',save.width>=Math.min(width-126,240),save);
    await shot('save-panel');
    await tap(entry('save-panel').locator('[data-action="save-disclosure"]'));
    const saveBrowser=await within('#save-panel .sample-save-browser','#save-panel .sample-save-panel');
    check('expanded save browser is contained',saveBrowser.fits,saveBrowser);
    const folders=await entry('save-panel').locator('[data-action="save-browser-location"]').evaluateAll(els=>els.map(el=>{
      const r=el.getBoundingClientRect();return {text:el.textContent.trim(),width:r.width,client:el.clientWidth,scroll:el.scrollWidth};
    }));
    check('save browser folder names fit their buttons',folders.every(f=>f.scroll<=f.client+1),folders);
    await shot('save-panel','browser');
    await tap(entry('save-panel').locator('[data-action="save-disclosure"]'));
    const mac=entry('popover-macos');
    if(await mac.locator('.sample-popover-macos').getAttribute('data-popover-open')!=='true')await mac.locator('[data-action="macos-popover-toggle"]').click();
    await page.waitForTimeout(150);
    const popover=await within('#popover-macos .sample-popover-panel','#popover-macos .sample-popover-window');
    check('macOS popover stays within its window',popover.fits,popover);
    await shot('popover-macos');
    await page.setViewportSize({width:width-10,height});
    await page.waitForTimeout(150);
    const resizedPopover=await within('#popover-macos .sample-popover-panel','#popover-macos .sample-popover-window');
    check('open macOS popover adapts to live resize',resizedPopover.fits,resizedPopover);
    await page.setViewportSize({width,height});
    const tokens=entry('token-field');
    await tokens.locator('input').last().fill('person.with.a.very.long.name@example-company.test');
    await tokens.locator('input').last().press('Enter');
    const token=await within('#token-field .sample-token-field','#token-field .element-preview');
    check('long recipient does not widen token field',token.fits,token);
    check('token feedback wraps',await tokens.locator('.sample-token-message').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
    await shot('token-field','long-recipient');
    const colors=entry('color-well');
    for(const action of ['toggle-color-palette','toggle-color-panel']) {
      await tap(colors.locator(`[data-action='${action}']`).first());
      if(action==='toggle-color-panel') {
        const panel=colors.locator('.sample-color-panel');
        await panel.waitFor({state:'visible'});
        // The child moves during overlay entry. Wait for that finite transition
        // before selecting it, and use touch input in the touch run.
        await panel.evaluate(async element=>{await Promise.all(element.getAnimations().map(animation=>animation.finished));});
        await tap(colors.locator('[data-action="toggle-color-picker"]'));
        await colors.locator('.sample-color-picker').waitFor({state:'visible'});
        check('full color panel opens its nested picker',await colors.locator('.sample-color-picker').isVisible());
      }
      await page.waitForTimeout(150);
      const selector=action==='toggle-color-panel'?'.sample-color-panel':'.sample-color-popover';
      const color=await within(`#color-well ${selector}`,'#color-well .element-preview');
      check(`${action} remains in preview`,color.fits,color);
      check(`${action} reserves its measured height`,await colors.locator(selector).evaluate(panel=>parseFloat(getComputedStyle(panel.closest('.ui-sample')).paddingBottom)>=panel.offsetHeight+11));
      await shot('color-well',action);
      if(action==='toggle-color-panel') {
        await page.setViewportSize({width:width-10,height});
        await settle();
        const resizedColor=await within(`#color-well ${selector}`,'#color-well .element-preview');
        check('open color panel adapts its reserved space to live resize',resizedColor.fits,resizedColor);
        await page.setViewportSize({width,height});
        await settle();
        const surface=colors.locator('.sample-color-picker-surface');
        check('nested color picker stays open across live resize',await surface.isVisible());
        await surface.waitFor({state:'visible'});
        const size=await surface.boundingBox();
        if(!size)throw new Error('The open color picker must expose a measurable surface.');
        await surface.click({position:{x:size.width-6,y:6}});
        await surface.press('End');
        await surface.press('PageUp');
        const marker=await within('#color-well .sample-color-picker-marker','#color-well .sample-color-picker-surface');
        check('color well marker remains visible at the corner',marker.fits,marker);
        await surface.press('ArrowLeft');
        check('color well surface supports keyboard adjustment',await surface.evaluate(el=>el.getAttribute('aria-valuetext')?.length>0));
        await shot('color-well','corner');
      }
      await page.keyboard.press('Escape');
      await settle();
      if(action==='toggle-color-panel'&&await colors.locator(selector).isVisible()) {
        check('Escape closes nested color picker first',!(await colors.locator('.sample-color-picker').isVisible()));
        await page.keyboard.press('Escape');
        await settle();
      }
      check(action+' closes with Escape',!(await colors.locator(selector).isVisible()));
    }
    const segmented=entry('segmented-control-macos');
    const segmentButtons=await segmented.getByRole('radio').evaluateAll(els=>els.map(el=>({text:el.textContent.trim(),client:el.clientWidth,scroll:el.scrollWidth})));
    check('segmented control labels fit',segmentButtons.every(b=>b.scroll<=b.client+1),segmentButtons);
    await segmented.getByRole('radio',{name:'Columns',exact:true}).click();
    check('segmented control selects columns',await segmented.getByRole('radio',{name:'Columns',exact:true}).getAttribute('aria-checked')==='true');
    const toggleRadios=entry('toggle-group-segmented-control').getByRole('radio');
    await toggleRadios.first().focus();
    await toggleRadios.first().press('End');
    check('toggle group End selects and focuses the last radio',await toggleRadios.last().evaluate(el=>el.getAttribute('aria-checked')==='true'&&el===document.activeElement));
    await toggleRadios.last().press('Home');
    check('toggle group Home restores the first radio',await toggleRadios.first().evaluate(el=>el.getAttribute('aria-checked')==='true'&&el===document.activeElement));
    await shot('toggle-group-segmented-control','keyboard-home');
    const vibrancy=entry('visual-effect-material-vibrancy');
    const vibrancyDemo=vibrancy.locator('.sample-vibrancy-demo');
    const materialLabels=await vibrancy.locator('.sample-vibrancy-material-options button').evaluateAll(buttons=>buttons.map(button=>{
      const text=document.createRange();text.selectNodeContents(button);
      const a=text.getBoundingClientRect(),b=button.getBoundingClientRect();
      return {label:button.textContent,fits:a.left>=b.left&&a.right<=b.right,textWidth:a.width,buttonWidth:b.width};
    }));
    check('vibrancy material labels fit inside their buttons',materialLabels.every(label=>label.fits),materialLabels);
    const material=await vibrancyDemo.getAttribute('data-material');
    const materialButton=vibrancy.locator('[data-action="vibrancy-material"]').first();
    const materialValue=await materialButton.getAttribute('data-material-value');
    await materialButton.evaluate(el=>el.dataset.materialValue='constructor');
    await tap(materialButton);
    check('vibrancy ignores inherited object keys as material names',await vibrancyDemo.getAttribute('data-material')===material);
    await materialButton.evaluate((el,value)=>el.dataset.materialValue=value,materialValue);
    await shot('visual-effect-material-vibrancy','invalid-key-ignored');
    await settle();
    const columnView=segmented.locator('.sample-mac-segmented-columns');
    const columnHeadings=await columnView.locator(':scope > div > small').evaluateAll(els=>els.map(el=>{
      const text=document.createRange();text.selectNodeContents(el);
      const a=text.getBoundingClientRect(),b=el.parentElement.getBoundingClientRect();
      return {label:el.textContent,fits:a.left>=b.left-1&&a.right<=b.right+1};
    }));
    check('column view headings stay inside their own columns',columnHeadings.every(h=>h.fits),columnHeadings);
    await shot('segmented-control-macos','columns');
    if(await columnView.evaluate(el=>el.scrollWidth>el.clientWidth+1)) {
      await columnView.focus();
      check('narrow column view receives keyboard focus',await columnView.evaluate(el=>el===document.activeElement));
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(250);
      check('narrow column view supports keyboard scrolling',await columnView.evaluate(el=>el.scrollLeft>0));
      await page.keyboard.press('ArrowLeft');
      check('narrow column view can scroll back with ArrowLeft',await columnView.evaluate(el=>el.scrollLeft===0));
      await page.keyboard.press('End');
      check('narrow column view reaches its end with End',await columnView.evaluate(el=>el.scrollLeft>=el.scrollWidth-el.clientWidth-1));
      await page.keyboard.press('Home');
      check('narrow column view returns to its start with Home',await columnView.evaluate(el=>el.scrollLeft===0));
      const finalColumn=await columnView.evaluate(el=>{
        el.scrollLeft=el.scrollWidth;
        const a=el.lastElementChild.getBoundingClientRect(),b=el.getBoundingClientRect();
        return {fits:a.left>=b.left-1&&a.right<=b.right+1,scroll:el.scrollLeft};
      });
      check('narrow column view can reveal its last column',finalColumn.fits,finalColumn);
      await shot('segmented-control-macos','columns-scroll-end');
    }
    const crumbs=entry('breadcrumbs'),disclosure=crumbs.locator('[data-action="toggle-breadcrumbs"]');
    for(const state of ['collapsed','expanded']) {
      if(state==='expanded') {
        await tap(disclosure);
        if(process.env.RESPONSIVE_MOTION==='normal') {
          const frames=await crumbs.locator('.sample-breadcrumbs').evaluate(async el=>{
            const samples=[];
            for(let i=0;i<18;i++) {
              await new Promise(requestAnimationFrame);
              samples.push({client:el.clientWidth,scroll:el.scrollWidth});
            }
            return samples;
          });
          check('breadcrumb reveal remains contained during animation',frames.every(f=>f.scroll<=f.client+1),frames);
        }
        await settle();
      }
      const crumbButton=await within('#breadcrumbs .sample-breadcrumb-disclosure button','#breadcrumbs .sample-breadcrumb-disclosure');
      check('breadcrumb disclosure fits '+state+' path',crumbButton.fits,crumbButton);
      check('breadcrumb '+state+' path does not overflow',await crumbs.locator('.sample-breadcrumbs').evaluate(el=>el.scrollWidth<=el.clientWidth+1));
      await shot('breadcrumbs',state);
    }
    const drawer=entry('hamburger-menu-nav-drawer');
    await tap(drawer.locator('[data-action="nav-drawer-toggle"]'));
    await shot('hamburger-menu-nav-drawer','open');
    await tap(drawer.locator('.sample-navigation-panel [data-action="nav-drawer-dismiss"]'));
    await settle();
    check('navigation drawer closes from its visible button',await drawer.locator('[data-action="nav-drawer-toggle"]').getAttribute('aria-expanded')==='false');
    for(const name of ['Dialog','Drawer','Sheet']) {
      const surface=entry('modal-dialog-drawer-sheet');
      await tap(surface.getByRole('button',{name,exact:true}));
      await settle();
      const dialog=page.locator('dialog:modal');
      const rect=await visibleRect(dialog);
      check(name+' fits the viewport',rect.fits,rect);
      const close=dialog.locator('[data-action="surface-dismiss"]').first();
      const closeRect=await visibleRect(close);
      check(name+' close control fits the viewport',closeRect.fits,closeRect);
      await page.screenshot({path:path.join(dir,'modal-'+name.toLowerCase()+'--viewport.png')});
      await close.click();
      await settle();
      check(name+' closes without submitting',await page.locator('dialog:modal').count()===0);
    }
    await entry('empty-trash-alert').locator('[data-action="trash-open"]').click();
    await settle();
    let dialog=page.locator('dialog:modal');
    let rect=await visibleRect(dialog);check('trash alert fits the viewport',rect.fits,rect);
    await dialog.locator('[data-action="trash-cancel"]').click();
    await settle();
    check('trash alert cancels without deleting',await page.locator('dialog:modal').count()===0);
    await entry('command-palette').locator('[data-action="command-palette-open"]').click();
    await settle();
    dialog=page.locator('dialog:modal');
    rect=await visibleRect(dialog);check('command palette fits the viewport',rect.fits,rect);
    await page.keyboard.press('Escape');await settle();check('command palette closes with Escape',await page.locator('dialog:modal').count()===0);
    await entry('lightbox').locator('[data-action="toggle-lightbox"]').first().click();
    await settle();
    dialog=page.locator('dialog:modal');
    rect=await visibleRect(dialog);check('lightbox fits the viewport',rect.fits,rect);
    await dialog.locator('[data-action="close-lightbox"]').click();
    await settle();
    check('lightbox close button dismisses it',await page.locator('dialog:modal').count()===0);
    const editor=entry('editor-colors-panel');
    await editor.locator('[data-action="editor-custom-toggle"]').click();
    const panel=editor.locator('.sample-floating-panel');
    await panel.evaluate(el=>el.scrollTop=el.scrollHeight);
    const note=await within('#editor-colors-panel .sample-editor-panel-note','#editor-colors-panel .sample-floating-panel');
    check('editor panel footer can be fully scrolled into view',note.fits,note);
    const editorSurface=editor.locator('.sample-editor-picker-surface'),editorSize=await editorSurface.boundingBox();
    await editorSurface.click({position:{x:editorSize.width-6,y:6}});
    await editorSurface.press('End');
    await editorSurface.press('PageUp');
    const editorMarker=await within('#editor-colors-panel .sample-editor-picker-marker','#editor-colors-panel .sample-editor-picker-surface');
    check('editor color marker remains visible at corner',editorMarker.fits,editorMarker);
    await shot('editor-colors-panel','scrolled-corner');
    await panel.evaluate(el=>el.scrollTop=0);
    await editor.locator('[data-action="editor-panel-close"]').click();
    await settle();
    check('editor close control remains reachable',await editor.locator('.sample-editor-colors-demo').getAttribute('data-panel-visible')==='false');
    const parallax=entry('parallax-scrolling').locator('.sample-parallax-viewport');
    const scroll=await parallax.evaluate(el=>{el.scrollTop=el.scrollHeight;return {top:el.scrollTop,max:el.scrollHeight-el.clientHeight};});
    check('intentional parallax scroller reaches its end',scroll.top===scroll.max&&scroll.max>0,scroll);
    await shot('parallax-scrolling','scroll-end');
    for(const id of ['timeline','badge-chip-pill-tag','share-card','drag-and-drop','menu-bar-extra','popover-dropdown-tooltip'])await shot(id);
    geom=await noHorizontal();check('page horizontal overflow after interactions',geom.scroll<=geom.width+1,geom);
    check('no browser runtime errors',errors.length===0,errors);
    const active=await page.evaluate(()=>document.activeElement?.outerHTML.slice(0,200));
    console.log(`${width} checked, failures ${results.filter(r=>r.width===width&&!r.pass).length}, active ${active}`);
    await context.close();
  }
} finally {
  await browser?.close();
  await preview.close();
  await fs.mkdir(root,{recursive:true});
  await fs.writeFile(path.join(root,'report.json'),JSON.stringify(results,null,2));
}
for(const failure of results.filter(r=>!r.pass))console.error(JSON.stringify(failure));
console.log(`${results.filter(r=>r.pass).length}/${results.length} checks passed`);
console.log(`Screenshots and report: ${root}`);
if(results.some(r=>!r.pass))process.exitCode=1;
