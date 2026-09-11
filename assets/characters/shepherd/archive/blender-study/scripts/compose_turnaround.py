"""Lay out Blender-rendered views at identical scale; no image synthesis."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parents[1]
R=ROOT/'renders'
front=Image.open(R/'front.png').convert('RGB')
side=Image.open(R/'side.png').convert('RGB')
back=Image.open(R/'back.png').convert('RGB')
assert front.size==side.size==back.size
w,h=front.size
side_width=round(w*.34)
views=[front,side.crop(((w-side_width)//2,0,(w+side_width)//2,h)),back]
gap=24;top=110;bottom=80
canvas=Image.new('RGB',(sum(v.width for v in views)+4*gap,h+top+bottom),(235,233,229))
draw=ImageDraw.Draw(canvas)
font_path='/System/Library/Fonts/Helvetica.ttc'
title=ImageFont.truetype(font_path,34)
small=ImageFont.truetype(font_path,23)
label=ImageFont.truetype(font_path,25)
draw.text((gap,22),'SHEPHERD / BLENDER REFERENCE STUDY',font=title,fill=(47,49,50))
draw.text((gap,66),'Static T-pose  ·  Actual 3D renders  ·  Front / side / back at the same scale',font=small,fill=(90,91,89))
x=gap
for view,name in zip(views,['FRONT','SIDE','BACK']):
    canvas.paste(view,(x,top))
    box=draw.textbbox((0,0),name,font=label);tw=box[2]-box[0]
    draw.text((x+(view.width-tw)/2,top+h+25),name,font=label,fill=(58,61,61))
    x+=view.width+gap
canvas.save(R/'shepherd-turnaround.png')
print('Saved',R/'shepherd-turnaround.png',canvas.size)
