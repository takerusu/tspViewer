// const d3 = require('d3');
import * as d3 from "d3";

class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  static randomPoint(width, height) {
    let x, y;
    x = parseInt(Math.random() * height);
    y = parseInt(Math.random() * width);
    return new Point(x, y);
  }
  dist2(to) {
    const x = to.x - this.x;
    const y = to.y - this.y;
    return Math.abs((x * x + y * y));
  }
}

function foldl(f, init, arr) {
  let ret = init;
  arr.forEach((a) => ret = f(ret, a));
  return ret;
}

class Map {
  init(x, y) {
    this.height = x;
    this.width = y;
    this._route = [];
    this.generate(1, 0);
    this.colorSet = d3.schemeCategory20;
  }

  generate(n, t) {
    this.n = n;
    this.points = [];

    this.T = t || 1000;
    this.memo = [];

    for (let i = 0; i < n; i++) {
      this.memo[i] = [];
      this.points[i] = Point.randomPoint(this.height, this.width);
    }
    this.set(t);
  }

  set(t) {
    this.T = t || 1000;
    this.temp = this.T;
    this._route = Array.from(Array(this.n).keys());
    this.DIST = this.dist2();
    this.t = 0;
    this.isFinished = false;
  }

  route(i) {
    if(arguments.length > 0) {
      if(i < this._route.length) {
        return this._route[i];
      } else {
        return this._route[0];
      }
    }
    return this._route.concat(this._route[0]);
  }


  dist2() {
    const arr = this._route.map((n, i) => {
      let next = this.route(i + 1);
      if(next > n) {
        const tmp = next;
        next = n;
        n = tmp;
      }
      const ret =
        this.memo[n][next] || (this.memo[n][next]  = this.points[n].dist2(this.points[next]));
      return ret;
    });
    return foldl((a, b) => a + b, 0, arr);
  }

  swap(l, r) {
    const tmp = this._route[r];
    this._route[r] = this._route[l];
    this._route[l] = tmp;
  }

  changeRoute() {
    let count = 0;
    do {
        let dist2 = this.dist2();
        const l = Math.floor(Math.random() * this.n);
        const r = Math.floor(Math.random() * this.n);
        if(l === r) continue;
        this.swap(l, r);
        let newdist2 = this.dist2();
        const diff = newdist2 - dist2;
        if(diff < 0) {
          break;
        } else if(diff > 0 && Math.exp(-diff / this.temp) > Math.random()) {
          break;
        } else {
          this.swap(r, l);
        }
        if(count > 10000) {
          console.log("finish");
          this.isFinished = true;
          window.clearInterval(window.cl);
          break;
        }
        count++;
    } while (true);
    this.t++;
    this.temp = this.temp * 0.995;
  }

  draw() {
    this.margin = 10;
    this.r = 4;

    this.line = d3.line()
      .x((d) => this.points[d].x + this.margin)
      .y((d) => this.points[d].y + this.margin);
    d3.select("#map").selectAll("svg").remove();
    const node = d3.select("#map").append("svg")
      .attr("width", this.width + this.margin)
      .attr("height", this.height + this.margin);


    node.datum(this.route())
      .append("path")
      .attr("stroke", this.colorSet[1])
      .attr("class", "line")
      .attr("d", this.line);

    node.selectAll(".point")
      .data(this.points).enter()
      .append("circle")
        .attr("class", "point")
        .attr("fill", this.colorSet[0])
        .attr("cx", (p) => this.margin + p.x)
        .attr("cy", (p) => this.margin + p.y)
        .attr("r", this.r);

    node.datum(this.dist2())
      .append("text")
      .text(d => `dist: ${d}`)
      .attr("class", "dist")
      .attr("x", this.margin)
      .attr("y", this.height - this.margin);

    node.datum(this.temp)
      .append("text")
      .text(d => `temp: ${d.toFixed(2)}`)
      .attr("class", "temp")
      .attr("x", this.margin)
      .attr("y", this.height - this.margin * 4);
  }
  redraw() {
    const node = d3.select("#map");

    node.selectAll(".point")
      .data(this.points)
        .attr("class", "point")
        .attr("cx", (p) => this.margin + p.x)
        .attr("cy", (p) => this.margin + p.y)
        .attr("r", this.r)
        .exit().remove();
    const line = node.selectAll(".line");

    line.datum(this.route())
      .attr("class", "line")
      .attr("d", this.line)
      .attr("stroke-dasharray", "")
      .attr("stroke-dashoffset", "")
      .exit().remove();

    node.selectAll(".dist").datum(this.dist2())
      .text(d => `dist: ${d}`)
      .attr("fill", "").attr("font-weight", "")
      .exit().remove();

    node.selectAll(".temp").datum(this.temp)
      .text(d => `temp: ${d.toFixed(2)}`)
      .exit().remove();

    if(this.isFinished) {
      node.selectAll(".dist")
        .attr("fill", "red").attr("font-weight", "bold");
      const l = line.node().getTotalLength();

      line.attr("animation-fill-mode", "forward")
        .attr("stroke-dasharray", l)
      .transition()
        .duration(l * 3)
        .ease((t) => t)
        .attrTween("stroke-dashoffset", () => {
          return (t) => l + l * t;
        })
      // const g = this.finish();
      // setInterval(() => g.next(), 100)
    }
  }

  // * finish() {
  //   const route = this.route();
  //   const node = d3.select("#map");
  //
  //   let arr = [];
  //   for (let i = 0; i < route.length; i++) {
  //     arr.push(route[i]);
  //     node.selectAll(".line").datum(arr)
  //       .attr("class", "line")
  //       .attr("d", this.line)
  //       .exit().remove();
  //       yield 0;
  //   }
  // }

}


window.onload = () => {
  let map = new Map();
  map.init(300, 600);
  map.draw();
  document.getElementById('button').onclick = () => {
    window.clearInterval(window.cl);
    const n = +document.getElementById('n').value;
    const t = +document.getElementById('t').value;
    map.generate(n, t);
    map.draw();

    const f = () => {
      map.changeRoute();
      map.redraw();
    };
    // window.setTimeout(f, 1000);
    window.cl = window.setInterval(f, 10);
  }

  document.getElementById('redo').onclick = () => {
    window.clearInterval(window.cl);
    const t = +document.getElementById('t').value;

    map.set(t);
    map.redraw();

    const f = () => {
      map.changeRoute();
      map.redraw();
    };
    // window.setTimeout(f, 1000);
    window.cl = window.setInterval(f, 10);
  }
}
