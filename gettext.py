import os
import re


HEADER = r"""# SOME DESCRIPTIVE TITLE.
# Copyright (C) YEAR THE PACKAGE'S COPYRIGHT HOLDER
# This file is distributed under the same license as the PACKAGE package.
# FIRST AUTHOR <EMAIL@ADDRESS>, YEAR.
#
#, fuzzy
msgid ""
msgstr ""
"Project-Id-Version: PACKAGE VERSION\n"
"Report-Msgid-Bugs-To: \n"
"POT-Creation-Date: 2017-07-20 17:40+0200\n"
"PO-Revision-Date: YEAR-MO-DA HO:MI+ZONE\n"
"Last-Translator: FULL NAME <EMAIL@ADDRESS>\n"
"Language-Team: LANGUAGE <LL@li.org>\n"
"Language: \n"
"MIME-Version: 1.0\n"
"Content-Type: text/plain; charset=CHARSET\n"
"Content-Transfer-Encoding: 8bit\n"
"""


if __name__ == '__main__':
    rexp = re.compile('(.*?[^a-zA-Z0-9_]|^)t\("(.*?)"[\)|,]')

    pot = open('locales/messages.pot', 'w')
    pot.write(HEADER)

    msgs = {}
    for root, dirs, files in os.walk('js'):
        for filename in files:
            if filename.endswith('.js'):
                filename = os.path.join(root, filename)
                for line_no, line in enumerate(open(filename)):
                    source = '%s:%d' % (filename, line_no + 1)
                    for match in rexp.finditer(line):
                        msgs.setdefault(match.group(2), []).append(source)

    for msg in sorted(msgs):
        pot.write('\n')
        for source in sorted(msgs[msg]):
            pot.write('#: %s\n' % source)
        pot.write('msgid "{}"\nmsgstr ""\n'.format(msg))
