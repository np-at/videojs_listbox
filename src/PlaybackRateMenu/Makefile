CWD := $(shell pwd)

FILES := $(wildcard *.ts)
O_FILES := $(addsuffix .js,$(basename $(FILES)))

%.js :: %.ts
	npx detype $< $@


clean:
	rm -f ./*.js

detyped: $(O_FILES)

.PHONY: detyped clean
