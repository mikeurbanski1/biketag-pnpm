import React, { useState } from 'react';

interface AddTagProps {
    saveTag: ({ name, contents }: { name: string; contents: string }) => void;
}

export const AddRootTag: React.FC<AddTagProps> = ({ saveTag }) => {
    const [name, setName] = useState('');
    const [contents, setContents] = useState('');

    return (
        <div className="add-root-tag">
            <label htmlFor="name">Location name: </label>
            <input type="text" name="name" onChange={(event) => setName(event.target.value)} value={name}></input>
            <br></br>
            <label htmlFor="contents">Your tag: </label>
            <input type="text" name="contents" onChange={(event) => setContents(event.target.value)} value={contents}></input>
            <br></br>
            <input type="button" name="save-tag" value="Save" onClick={() => saveTag({ name, contents })}></input>
        </div>
    );
};

interface AddSubtagProps {
    saveTag: ({ contents }: { contents: string }) => void;
}

export const AddSubtag: React.FC<AddSubtagProps> = ({ saveTag }) => {
    const [contents, setContents] = useState('');

    return (
        <div className="add-subtag">
            <label htmlFor="contents">Your tag: </label>
            <input type="text" name="contents" onChange={(event) => setContents(event.target.value)} value={contents}></input>
            <br></br>
            <input type="button" name="save-tag" value="Save" onClick={() => saveTag({ contents })}></input>
        </div>
    );
};
