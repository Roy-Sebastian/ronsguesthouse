#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const CANVAS_WIDTH = 2000;
const CANVAS_HEIGHT = 2000;
const CLASS_WIDTH = 180;
const CLASS_HEIGHT = 60;
const GRID_STEP = 20;

class MermaidDrawIOConverter {
  constructor() {
    this.cellId = 1;
    this.cells = [];
    this.classPositions = {};
    this.classCount = 0;
  }

  parseMermaid(mmdContent) {
    const classes = {};
    const relations = [];

    const lines = mmdContent.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('direction') && !l.startsWith('classDiagram'));

    let currentClass = null;
    let currentMembers = [];

    for (const line of lines) {
      if (line.startsWith('class ')) {
        if (currentClass) {
          classes[currentClass] = currentMembers;
        }
        currentClass = line.match(/class\s+(\w+)/)?.[1];
        currentMembers = [];
      } else if (line.startsWith('<<')) {
        if (currentClass) {
          currentMembers.push(line);
        }
      } else if (line.match(/^\s*\+/) || line.match(/^\s*-/)) {
        if (currentClass) {
          currentMembers.push(line.trim());
        }
      } else if (line.includes('-->') || line.includes('--') || line.includes('→')) {
        relations.push(line);
      }
    }
    if (currentClass) {
      classes[currentClass] = currentMembers;
    }

    return { classes, relations };
  }

  generateCellId() {
    return String(++this.cellId);
  }

  addCell(id, value, style, geometry) {
    this.cells.push({ id, value, style, geometry });
  }

  layoutClasses(classCount) {
    const cols = Math.ceil(Math.sqrt(classCount));
    const spacing = 250;
    const positions = {};
    let index = 0;

    const keys = Object.keys(this.classPositions);
    for (const key of keys) {
      const row = Math.floor(index / cols);
      const col = index % cols;
      positions[key] = {
        x: col * spacing + 20,
        y: row * spacing + 20,
      };
      index++;
    }
    return positions;
  }

  createClass(name, members) {
    const id = this.generateCellId();
    this.classPositions[name] = { x: 0, y: 0 };
    this.classCount++;

    const height = Math.max(CLASS_HEIGHT, 26 + members.length * 16);
    const geometry = {
      x: 0,
      y: 0,
      w: CLASS_WIDTH,
      h: height,
    };

    const style = 'swimlane;fontStyle=1;align=center;verticalAlign=top;childLayout=stackLayout;horizontal=1;startSize=26;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=1;marginBottom=0;whiteSpace=wrap;html=1;fontSize=12;';

    this.addCell(id, name, style, geometry);

    // Add members
    let memberOffset = 26;
    for (const member of members) {
      const memberId = this.generateCellId();
      const memberStyle = 'text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=4;spacingRight=4;overflow=hidden;rotatable=0;points=[[0,0],[0,0.5],[0,1],[0.5,0],[0.5,0.5],[0.5,1],[1,0],[1,0.5],[1,1]];portConstraint=eastwest;fontSize=12;';
      const memberGeometry = {
        x: 0,
        y: memberOffset,
        w: CLASS_WIDTH,
        h: 16,
      };
      this.addCell(memberId, member, memberStyle, memberGeometry);
      memberOffset += 16;
    }

    return id;
  }

  createRelation(fromName, toName, label = '') {
    if (!this.classPositions[fromName] || !this.classPositions[toName]) return;

    const id = this.generateCellId();
    const style = 'edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;fontSize=12;';

    const geometry = {
      relative: 1,
    };

    this.addCell(id, label, style, geometry);
  }

  generateXML() {
    const positions = this.layoutClasses(this.classCount);

    // Update positions
    let cellIndex = 1;
    const classNames = Object.keys(this.classPositions);
    for (const className of classNames) {
      const pos = positions[className];
      // Find cells for this class and update position
      for (const cell of this.cells) {
        if (cell.value === className) {
          cell.geometry.x = pos.x;
          cell.geometry.y = pos.y;
          break;
        }
      }
    }

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="draw.io" modified="2024-01-01T00:00:00.000Z" agent="mermaid-converter/1.0" version="1.0" type="device">
  <diagram name="Page-1" id="diagram1">
    <mxGraphModel dx="1000" dy="1000" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="2200" pageHeight="2200" math="0" shadow="0">
      <root>
        <mxCell id="0" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;" vertex="1" parent="1" />
        <mxCell id="1" parent="0" />
`;

    for (const cell of this.cells) {
      const { id, value, style, geometry } = cell;
      if (geometry.relative) {
        xml += `        <mxCell id="${id}" value="${this.escape(value)}" style="${style}" edge="1" parent="1" source="2" target="3">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>\n`;
      } else {
        xml += `        <mxCell id="${id}" value="${this.escape(value)}" style="${style}" vertex="1" parent="1">
          <mxGeometry x="${geometry.x}" y="${geometry.y}" width="${geometry.w}" height="${geometry.h}" as="geometry" />
        </mxCell>\n`;
      }
    }

    xml += `      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;

    return xml;
  }

  escape(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  convert(mmdContent) {
    const { classes } = this.parseMermaid(mmdContent);

    for (const [className, members] of Object.entries(classes)) {
      this.createClass(className, members);
    }

    return this.generateXML();
  }
}

// Main
const files = ['01-domain.mmd', '02-layered.mmd', '03-auth-middleware.mmd'];

for (const file of files) {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const mmdContent = fs.readFileSync(filePath, 'utf8');
    const converter = new MermaidDrawIOConverter();
    const xml = converter.convert(mmdContent);
    const outFile = file.replace('.mmd', '.drawio');
    const outPath = path.join(__dirname, outFile);
    fs.writeFileSync(outPath, xml);
    console.log(`✓ ${file} → ${outFile}`);
  } else {
    console.log(`✗ ${file} not found`);
  }
}
