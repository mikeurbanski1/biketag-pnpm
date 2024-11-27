import dayjs from 'dayjs';
import React, { useState } from 'react';

interface AddTagProps {
    saveTag: ({ name, contents, date }: { name: string; contents: string; date: string }) => void;
    isRootTag: boolean;
}

export const AddTag: React.FC<AddTagProps> = ({ saveTag, isRootTag }) => {
    const [name, setName] = useState('');
    const [contents, setContents] = useState('');
    const [date, setDate] = useState(dayjs().format('YYYY-MM-DDTHH:mm'));

    const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target['validity'].valid) return;
        setDate(event.target.value);
    };

    const canSave = contents.length > 0 && dayjs(date).isValid() && (isRootTag ? name.length > 0 : true);

    const locationElements = isRootTag
        ? [
              <label key="name" htmlFor="name">
                  Location name:{' '}
              </label>,
              <input key="name-input" type="text" name="name" onChange={(event) => setName(event.target.value)} value={name}></input>,
              <br key="br"></br>
          ]
        : undefined;

    return (
        <div className="add-root-tag">
            {locationElements}
            <label htmlFor="contents">Your tag: </label>
            <input type="text" name="contents" onChange={(event) => setContents(event.target.value)} value={contents}></input>
            <br></br>
            <input aria-label="Date and time" type="datetime-local" defaultValue={date} onChange={handleDateChange} />
            <br></br>
            <input type="button" name="save-tag" value="Save" disabled={!canSave} onClick={() => saveTag({ name, contents, date })}></input>
        </div>
    );
};
