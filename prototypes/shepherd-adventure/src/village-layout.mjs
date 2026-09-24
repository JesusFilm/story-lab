// September layout plan: +X is each house's door-facing local axis.
export const HOUSE_YAWS={2:105*Math.PI/180,6:0,10:-105*Math.PI/180,11:-2*Math.PI/3};
// Mount annexes in house-local space, overlapping the host wall by 0.25 m.
export const HOUSE_ANNEXES=[
 {house:1,x:0,z:4.4,width:4.4,depth:3.3},
 {house:2,x:0,z:-4.4,width:4.4,depth:3.3},
 {house:3,x:0,z:-4.4,width:4.4,depth:3.3},
 {house:5,x:0,z:4.4,width:4.4,depth:3.3},
 {house:8,x:-3.9,z:0,width:3.7,depth:5.5},
 {house:9,x:0,z:4.4,width:4.4,depth:3.3},
];
// Blue strokes from the annotated X/Z plan, sampled as connected masonry runs.
export const DECORATIVE_WALL_PATHS=[
 [[-13,41.7],[-10.5,41.7],[-8.5,40.8],[-6.8,38.2]],
 [[3,26],[4.2,30],[5.6,34],[6.5,38.5],[7.4,39.6],[14,41]],
 // Keep the House 1 run on the east side of both house orientations and
 // clear of the attached north/south annex in canonical and rehearsal maps.
 [[-5.5,18.5],[-5,17]],
 [[15.5,14],[21,11.2]],
 [[23,2],[25.5,.5],[28,0]],
 // Attach the House 8 annex run on its north side, then turn east clear of
 // the House 8 footprint in both canonical and rehearsal orientations.
 [[6,-8],[7,-15.25],[8,-16]],
 // The square is a route junction, so leave a deliberate opening between the
 // two attached decorative-wall sections rather than blocking its approaches.
 [[-5,-12.8],[-2.9,-13],[-0.1,-12.8]],
 [[-12.3,-2],[-15.3,-4.5],[-15.5,-5.2],[-14,-5],[-9,-3.3]],
 [[-26,-11.2],[-26.8,-14],[-26.2,-16.2],[-24.5,-18],[-22.7,-18.7]],
 [[-21.5,-19.2],[-22,-22]],
 [[1,-33.3],[3,-35.5],[6,-37.1],[9,-38],[12,-38.1],[15.5,-37]],
 [[5.2,-5],[5.9,-3],[6.7,-1.2]],
];

// Each sketched run has explicit hosts. Null denotes an intentional open end.
// Endpoint coordinates choose the attachment side; mesh intersections seal joins.
export const DECORATIVE_WALL_HOSTS=[
 ['south-boundary',null],
 [null,'south-boundary'],
 ['House 1',null],
 ['House 2','House 5'],
 ['House 5 annex',null],
 ['House 8 annex',null],
 ['House 7',null],
 ['House 3','House 3'],
 ['House 6','Empty stall 1'],
 ['Empty stall 1','House 9 annex'],
 ['House 10','House 11'],
 [null,'House 4'],
];
