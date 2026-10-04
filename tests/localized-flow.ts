import assert from 'node:assert/strict';
import path from 'node:path';
import type {Browser} from 'playwright';
import dictionary from '../src/locales/runtime-vi.json' with {type:'json'};
export async function checkVietnameseFlow(browser:Browser,base:string,output:string):Promise<void>{
 const context=await browser.newContext({viewport:{width:390,height:844},colorScheme:'dark',reducedMotion:'reduce'});
 try{
  const page=await context.newPage();const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));await page.goto(base+'/vi/elements/');
  const sample=(id:string)=>page.locator('.element-preview .ui-sample[data-specimen-id="'+id+'"]');
  const windows=sample('mac-window');
  await windows.getByRole('button',{name:dictionary['Close window'],exact:true}).click();
  assert(await windows.locator('.sample-mac-window').evaluate(element=>element.classList.contains('is-closed')));
  await windows.getByRole('button',{name:dictionary['Restore window'],exact:true}).click();
  assert.equal(await windows.locator('.sample-mac-window').evaluate(element=>element.classList.contains('is-closed')),false);
  const date=sample('date-picker');await date.locator('[data-action="calendar-toggle"]').click();
  await date.locator('.sample-calendar').waitFor({state:'visible'});
  const heading=await date.locator('[data-calendar-title]').innerText();assert(/tháng/i.test(heading));
  await page.screenshot({path:path.join(output,'vi-calendar-open.png')});await page.keyboard.press('Escape');
  const slider=sample('volume-slider').locator('[data-volume-control]');
  await slider.focus();await page.keyboard.press('Home');
  assert.equal(await slider.getAttribute('aria-valuetext'),dictionary['Muted']);
  const entry=sample('modal-dialog-drawer-sheet');await entry.locator('[data-action="surface-select"][data-surface="dialog"]').click();
  const dialog=page.locator('dialog:modal');await dialog.waitFor({state:'visible'});
  assert((await dialog.innerText()).length>0);
  const box=await dialog.boundingBox();assert(box && box.x>=0 && box.y>=0 && box.x+box.width<=390 && box.y+box.height<=844);
  await page.screenshot({path:path.join(output,'vi-dialog-open.png')});await dialog.locator('[data-action="surface-dismiss"]').first().click();
  assert.equal(await dialog.isVisible(),false);assert.deepEqual(errors,[]);
 }finally{await context.close();}
 const large=await browser.newContext({viewport:{width:360,height:800},colorScheme:'light',reducedMotion:'reduce'});
 try{
  const page=await large.newPage();
  for(const route of ['/','/vi/']){
   await page.goto(base+route);await page.evaluate(()=>document.fonts.ready);await page.evaluate(()=>document.documentElement.style.fontSize='200%');
   await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>{resolve();}))));
   const geometry=await page.evaluate(()=>{
    const hero=document.querySelector('.hero')?.getBoundingClientRect(),content=document.querySelector('.hero-content')?.getBoundingClientRect();
    return {width:innerWidth,scroll:document.documentElement.scrollWidth,heroRight:hero?.right,contentRight:content?.right,nav:Array.from(document.querySelectorAll('.nav-text')).map(element=>({right:element.getBoundingClientRect().right,parentRight:element.parentElement?.getBoundingClientRect().right}))};
   });
   assert(geometry.scroll<=geometry.width+1,JSON.stringify(geometry));assert(geometry.heroRight!==undefined&&geometry.contentRight!==undefined&&geometry.contentRight<=geometry.heroRight);
   for(const item of geometry.nav)assert(item.parentRight!==undefined&&item.right<=item.parentRight);
   await page.screenshot({path:path.join(output,route==='/'?'en-overview-large-text.png':'vi-overview-large-text.png'),fullPage:true});
  }
 }finally{await large.close();}
}
