import {defineConfig,devices} from '@playwright/test';
export default defineConfig({
 testDir:'./mobile-tests',timeout:420000,expect:{timeout:30000},fullyParallel:false,workers:1,retries:0,
 outputDir:'test-results/mobile',reporter:[['list'],['html',{open:'never'}]],
 use:{baseURL:'http://127.0.0.1:8960/story-lab/',trace:{mode:'retain-on-failure',screenshots:false,snapshots:true,sources:true},screenshot:'only-on-failure',actionTimeout:30000},
 webServer:{command:'python3 serve.py --port 8960',url:'http://127.0.0.1:8960/story-lab/',reuseExistingServer:false},
 projects:[
  {name:'android-portrait-dpr3',use:{...devices['Pixel 7'],viewport:{width:393,height:851},deviceScaleFactor:3,browserName:'chromium',channel:'chromium',launchOptions:{executablePath:process.env.BROWSER_PATH,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}}},
  {name:'android-landscape-dpr4',use:{...devices['Pixel 7 landscape'],viewport:{width:851,height:393},deviceScaleFactor:4,browserName:'chromium',channel:'chromium',launchOptions:{executablePath:process.env.BROWSER_PATH,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}}},
  {name:'webkit-iphone',use:{...devices['iPhone 13'],browserName:'webkit',reducedMotion:'reduce'}}
 ]
});
