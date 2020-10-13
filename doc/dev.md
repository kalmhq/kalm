# Dev

in dev process, how to deal with breaking changes in CRD

1. delete related resources of CRDs
2. delete CRDs
3. run `make install`

for step 1 and 2, you can also simply do `make uninstall`, but for CRDs with existing resources, this may be blocked, in this case, we need manually deleting related resources as shown in step 1.

