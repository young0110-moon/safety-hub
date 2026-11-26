# index.html → guest.html (게스트 체험용: 진짜 서버 대신 guest.js 예시 데이터)
import sys
src,dst=sys.argv[1],sys.argv[2]
s=open(src,encoding='utf-8').read()
a='''<script src="vendor/firebase-app-compat.js"></script>
<script src="vendor/firebase-auth-compat.js"></script>
<script src="vendor/firebase-firestore-compat.js"></script>
<script src="config.js"></script>'''
assert a in s,'script tags changed'
s=s.replace(a,'<script src="config.js"></script><script src="guest.js"></script>',1)
s=s.replace('<head>','<head><meta name="robots" content="noindex">',1)
open(dst,'w',encoding='utf-8').write(s)
