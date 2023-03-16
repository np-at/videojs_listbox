CWD := $(shell pwd)
SRC = $(CWD)/src


all: detyped
detyped:
	cd $(SRC) && $(MAKE) detyped


clean:
	cd $(SRC) && $(MAKE) clean


.PHONY: detyped clean all
