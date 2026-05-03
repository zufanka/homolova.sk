<script>
  import austria from '../img/header/austria.png';
  import croatia from '../img/header/croatia.png';
  import estonia from '../img/header/estonia.png';
  import malta from '../img/header/malta.png';
  import czechia from '../img/header/czechia.png';

  const images = [austria, croatia, estonia, malta, czechia];

  function jitter(base, range) {
    return base + (Math.random() - 0.5) * 2 * range;
  }

  // Base positions scattered around edges, leaving center clear for text
  // On each load, x/y shift ±4%, rotation ±10°, scale ±0.1
  const passports = [
    { x: 3,  y: 5,  rot: -18, scale: 1.1,  img: 0 },  // top-left
    { x: 30, y: 3,  rot: 12,  scale: 0.8,  img: 1 },   // top-center-left
    { x: 60, y: 3,  rot: -8,  scale: 0.9,  img: 2 },   // top-center-right
    { x: 90, y: 8,  rot: 22,  scale: 1.0,  img: 3 },   // top-right
    { x: 5,  y: 50, rot: -25, scale: 0.85, img: 4 },   // mid-left
    { x: 88, y: 48, rot: 15,  scale: 0.95, img: 1 },   // mid-right
    { x: 12, y: 75, rot: 8,   scale: 0.7,  img: 3 },   // bottom-left
  ].map(p => ({
    x:     jitter(p.x, 4),
    y:     jitter(p.y, 4),
    rot:   jitter(p.rot, 10),
    scale: Math.max(0.5, jitter(p.scale, 0.1)),
    img:   p.img,
  }));
</script>

<div class="passports-container">
  {#each passports as p}
    <img
      src={images[p.img]}
      alt="EU passport"
      class="passport"
      style="
        left: {p.x}%;
        top: {p.y}%;
        transform: translate(-50%, -50%) rotate({p.rot}deg) scale({p.scale});
      "
    />
  {/each}
</div>

<style>
  .passports-container {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .passport {
    position: absolute;
    width: 140px;
    height: auto;
    filter: drop-shadow(2px 4px 8px rgba(0, 0, 0, 0.15));
    transform-origin: center center;
  }
</style>
