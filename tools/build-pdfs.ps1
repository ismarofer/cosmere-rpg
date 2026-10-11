param([string[]]$Paths = @('danzante','nominador','corredor','custodio'))
$ErrorActionPreference = 'Stop'
$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$root = Split-Path -Parent $PSScriptRoot
$log = @()
foreach ($p in $Paths) {
  & node (Join-Path $root 'tools/print-talents.mjs') $p | Out-Null
  $in  = Join-Path $root "talentos_$p.html"
  $out = Join-Path $root "talentos_$p.pdf"
  if (Test-Path $out) { Remove-Item $out -Force }
  $uri  = ([System.Uri]$in).AbsoluteUri
  $prof = Join-Path $env:TEMP ("edgepdf_" + [guid]::NewGuid().ToString('N'))
  Start-Process -FilePath $edge -ArgumentList @("--headless=new","--disable-gpu","--no-first-run","--user-data-dir=$prof","--no-pdf-header-footer","--print-to-pdf=$out","$uri") -Wait -NoNewWindow
  Remove-Item $prof -Recurse -Force -ErrorAction SilentlyContinue
  if (Test-Path $out) { $log += ("OK   {0}  {1} bytes" -f $p, (Get-Item $out).Length) }
  else { $log += ("FAIL {0}" -f $p) }
}
$log -join "`n" | Set-Content (Join-Path $root 'tools/_pdf_result.log') -Encoding UTF8
