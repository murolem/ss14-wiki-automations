import path from 'path';
import http from 'isomorphic-git/http/node';
import fs from 'fs';
import git from 'isomorphic-git';

const gitConfig = {
    path,
    http,
    fs
}

export {
    git,
    gitConfig
}
