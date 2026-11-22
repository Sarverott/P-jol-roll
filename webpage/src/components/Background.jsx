// The background of the page (p5.js): acts drifting as points, tied by red threads when they
// come near - the way the law ties its acts - and the logo of the project turning slowly in
// the middle; the pointer pulls the nearest acts. The colours are the page's own (style.css),
// so the dark look gets a dark background. Behind everything, never clicked; with "reduce
// motion" one still frame is drawn.
import p5 from "p5";
import { useEffect, useRef } from "react";

const ACTS = 120;
const NEAR = 170;
const LOGO = "./icon-512.png";

function sketch(p) {
	let acts = [];
	let logo;
	let colours;
	const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

	const css = (name) =>
		getComputedStyle(document.documentElement).getPropertyValue(name).trim();

	p.setup = async () => {
		p.createCanvas(innerWidth, innerHeight);
		p.frameRate(30);
		colours = {
			bg: p.color(css("--bg") || "#fbfaf7"),
			thread: p.color(css("--accent") || "#9b2c2c"),
			// every third thread in the colour of what is being done (style.css --doing)
			other: p.color(css("--doing") || "#8a6a12"),
			act: p.color(css("--muted") || "#5f5d57"),
		};
		acts = Array.from({ length: ACTS }, (_, i) => ({
			x: p.random(p.width),
			y: p.random(p.height),
			seed: i * 17.3,
			size: p.random(2, 6),
		}));
		logo = await p.loadImage(LOGO);
		if (still) {
			p.noLoop();
			p.redraw();
		}
	};

	p.draw = () => {
		p.background(colours.bg);
		const t = p.frameCount * 0.004;
		if (logo) {
			// big enough to show around the text, breathing and turning
			const side =
				Math.max(p.width, p.height) * (0.85 + Math.sin(t * 3) * 0.05);
			p.push();
			p.translate(p.width / 2, p.height / 2);
			p.rotate(t * 0.6);
			p.tint(255, 46);
			p.imageMode(p.CENTER);
			p.image(logo, 0, 0, side, side);
			p.pop();
		}
		// the acts drift along a field of noise; the pointer pulls the near ones
		for (const act of acts) {
			const angle =
				p.noise(act.x * 0.002, act.y * 0.002, t + act.seed) * p.TWO_PI * 2;
			act.x += Math.cos(angle) * 0.9;
			act.y += Math.sin(angle) * 0.9;
			const dx = p.mouseX - act.x;
			const dy = p.mouseY - act.y;
			const far = Math.hypot(dx, dy);
			if (far < 200 && far > 1) {
				act.x += (dx / far) * 0.8;
				act.y += (dy / far) * 0.8;
			}
			act.x = (act.x + p.width) % p.width;
			act.y = (act.y + p.height) % p.height;
		}
		// red threads between acts that come near, fainter the farther
		for (let i = 0; i < acts.length; i++)
			for (let j = i + 1; j < acts.length; j++) {
				const far = p.dist(acts[i].x, acts[i].y, acts[j].x, acts[j].y);
				if (far > NEAR) continue;
				const thread = p.color((i + j) % 3 ? colours.thread : colours.other);
				thread.setAlpha(170 * (1 - far / NEAR));
				p.stroke(thread);
				p.strokeWeight(1.5 * (1 - far / NEAR) + 0.4);
				p.line(acts[i].x, acts[i].y, acts[j].x, acts[j].y);
			}
		p.noStroke();
		for (const act of acts) {
			const dot = p.color(colours.act);
			dot.setAlpha(160);
			p.fill(dot);
			p.circle(act.x, act.y, act.size);
		}
	};

	p.windowResized = () => {
		p.resizeCanvas(innerWidth, innerHeight);
		if (still) p.redraw();
	};
}

export default function Background() {
	const box = useRef(null);
	useEffect(() => {
		const drawing = new p5(sketch, box.current);
		return () => drawing.remove();
	}, []);
	return <div ref={box} className="background" aria-hidden="true" />;
}
