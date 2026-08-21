from pathlib import Path
p=Path('blind-is-you/index.html')
s=p.read_text()
assert "var VERSION='1.0'" in s, 'expected v1.0 base'
s=s.replace('<title>Blind Is You 1.0</title>','<title>Blind Is You 1.1</title>')
s=s.replace('data-version="1.0"','data-version="1.1"',1)
s=s.replace("var VERSION='1.0';","var VERSION='1.1';",1)
s=s.replace('Working-memory arcade · v1.0','Working-memory arcade · v1.1')
s=s.replace("r.version==='1.0'","(r.version==='1.0'||r.version==='1.1')")
s=s.replace('</head>','<link rel="stylesheet" href="v11.css?v=11">\n</head>',1)
s=s.replace('</body>','<script src="v11.js?v=11"></script>\n</body>',1)
p.write_text(s)
