# .containerdatavol

Data of containers that has to outlive them but is never pushed anywhere:
caches, logs, databases of the services. One directory per volume, named
like the volume in its `resources/services/<service>.yaml`. Everything here
but this file is ignored by git and left out of images.
